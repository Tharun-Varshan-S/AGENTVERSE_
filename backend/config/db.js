const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
require('dotenv').config({ path: path.join(__dirname, '../.env') });



const store = new Map();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("[MongoDB Error] MONGODB_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    const timeoutMs = process.env.ALLOW_INMEMORY_FALLBACK === 'true' ? 3000 : 15000;
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: timeoutMs });
    console.log(`[MongoDB] Connected successfully to MongoDB server: ${conn.connection.host}`);
    console.log(`[MongoDB] Connected to database: ${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`\n=====================================================================`);
    console.error(`[MongoDB Error] COULD NOT CONNECT TO PERSISTENT MONGO DB INSTANCE!`);
    console.error(`[MongoDB Error] URI: ${uri}`);
    console.error(`[MongoDB Error] Reason: ${err.message}`);
    console.error(`=====================================================================\n`);

    const allowFallback = process.env.ALLOW_INMEMORY_FALLBACK === 'true';

    if (!allowFallback) {
      console.error(`[MongoDB Fatal] Persistent database connection required. Exiting process...`);
      process.exit(1);
    }

    console.warn(`[MongoDB Warning] ALLOW_INMEMORY_FALLBACK=true detected in environment.`);
    console.warn(`[MongoDB Warning] Switched to Stage 1-5 in-memory database emulation mode.`);

    // Fallback overrides for offline execution
    mongoose.Model.prototype.save = async function() {
      const modelName = this.constructor.modelName || 'Model';
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      if (this.incident_id) {
        store.set(`${modelName}:${this.incident_id}`, this);
      }
      store.set(`${modelName}:${this._id.toString()}`, this);
      return this;
    };

    mongoose.Model.findOne = async function(query) {
      const modelName = this.modelName || 'Model';
      if (query && query.incident_id && store.has(`${modelName}:${query.incident_id}`)) {
        return store.get(`${modelName}:${query.incident_id}`);
      }
      if (query && query.workflow_id && store.has(`${modelName}:${query.workflow_id}`)) {
        return store.get(`${modelName}:${query.workflow_id}`);
      }
      if (query && query._id && store.has(`${modelName}:${query._id.toString()}`)) {
        return store.get(`${modelName}:${query._id.toString()}`);
      }
      if (query && query.$or) {
        // Very basic manual scan for testing auth
        for (const [key, doc] of store.entries()) {
          if (doc.constructor && doc.constructor.modelName === modelName) {
            for (const condition of query.$or) {
              if (condition.admin_id && doc.admin_id === condition.admin_id) return doc;
              if (condition.email && doc.email === condition.email) return doc;
            }
          }
        }
      }
      return null;
    };

    mongoose.Model.findById = async function(id) {
      const modelName = this.modelName || 'Model';
      if (id && store.has(`${modelName}:${id.toString()}`)) {
        return store.get(`${modelName}:${id.toString()}`);
      }
      return null;
    };

    mongoose.Model.find = function(query = {}) {
      const modelName = this.modelName || 'Model';
      const docs = Array.from(store.values()).filter((doc, index, self) => {
        if (doc.constructor && doc.constructor.modelName !== modelName) return false;
        
        if (doc.incident_id && self.findIndex(d => d.incident_id === doc.incident_id && d.constructor.modelName === modelName) !== index) {
          return false;
        }
        if (query && query.status) {
          const currentTrackingStatus = doc.tracking ? doc.tracking.current_status : null;
          if (doc.status !== query.status && currentTrackingStatus !== query.status) {
            return false;
          }
        }
        return true;
      });

      docs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      return {
        sort: function() { return this; },
        exec: async function() { return docs; },
        then: function(resolve, reject) { return resolve(docs); }
      };
    };

    mongoose.Model.deleteMany = async function() {
      const modelName = this.modelName || 'Model';
      for (const [key, doc] of store.entries()) {
          if (doc.constructor && doc.constructor.modelName === modelName) {
              store.delete(key);
          }
      }
      return { acknowledged: true, deletedCount: 0 };
    };

    mongoose.Model.insertMany = async function(docs) {
      const modelName = this.modelName || 'Model';
      docs.forEach(doc => {
        const instance = new this(doc);
        if (!instance._id) instance._id = new mongoose.Types.ObjectId();
        if (instance.incident_id) store.set(`${modelName}:${instance.incident_id}`, instance);
        store.set(`${modelName}:${instance._id.toString()}`, instance);
      });
      return docs;
    };

    mongoose.Model.create = async function(doc) {
      const instance = new this(doc);
      return await instance.save();
    };

    mongoose.Model.findOneAndUpdate = async function(query, update, options = {}) {
      let doc = await this.findOne(query);
      if (!doc) {
        if (options.upsert) {
          doc = new this();
          for (const [k, v] of Object.entries(query)) {
            doc[k] = v;
          }
          if (update.$setOnInsert) Object.assign(doc, update.$setOnInsert);
        } else {
          return null;
        }
      }
      
      if (update.$inc || update.$set || update.$setOnInsert) {
        if (update.$inc) {
          for (const [k, v] of Object.entries(update.$inc)) {
            doc[k] = (doc[k] || 0) + v;
          }
        }
        if (update.$set) {
          for (const [k, v] of Object.entries(update.$set)) {
            doc[k] = v;
          }
        }
      } else {
        // Direct property assignment
        for (const [k, v] of Object.entries(update)) {
          doc[k] = v;
        }
      }
      await doc.save();
      return doc;
    };

    return mongoose.connection;
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  console.log('[MongoDB] Connection closed.');
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
