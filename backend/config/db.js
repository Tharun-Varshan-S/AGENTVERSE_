const mongoose = require('mongoose');
require('dotenv').config();

const store = new Map();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civic_complaint_db';

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[MongoDB] Connected successfully to MongoDB server: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.log(`[MongoDB] Live MongoDB server at ${uri} unavailable (${err.message}).`);
    console.log(`[MongoDB] Switched to Stage 1-5 in-memory database emulation mode.`);

    // Fallback overrides for offline execution
    mongoose.Model.prototype.save = async function() {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      if (this.incident_id) {
        store.set(this.incident_id, this);
      }
      store.set(this._id.toString(), this);
      return this;
    };

    mongoose.Model.findOne = async function(query) {
      if (query && query.incident_id && store.has(query.incident_id)) {
        return store.get(query.incident_id);
      }
      if (query && query._id && store.has(query._id.toString())) {
        return store.get(query._id.toString());
      }
      return null;
    };

    mongoose.Model.findById = async function(id) {
      if (id && store.has(id.toString())) {
        return store.get(id.toString());
      }
      return null;
    };

    mongoose.Model.find = function(query = {}) {
      const docs = Array.from(store.values()).filter((doc, index, self) => {
        if (doc.incident_id && self.findIndex(d => d.incident_id === doc.incident_id) !== index) {
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
      store.clear();
      return { acknowledged: true, deletedCount: 0 };
    };

    mongoose.Model.insertMany = async function(docs) {
      docs.forEach(doc => {
        const instance = new this(doc);
        if (!instance._id) instance._id = new mongoose.Types.ObjectId();
        if (instance.incident_id) store.set(instance.incident_id, instance);
        store.set(instance._id.toString(), instance);
      });
      return docs;
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
