const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const KnowledgeBase = require('../models/KnowledgeBase');

const MUNICIPAL_KB_DATA = [
  {
    category: 'pothole',
    department_name: 'Roads & Infrastructure Department',
    service_name: 'Pothole & Asphalt Repair Service',
    ward: 'Ward 12',
    sla_hours: 24,
    officer_role: 'Executive Engineer (Civil & Roads)',
    portal_url: 'https://chennaicorporation.gov.in/gcc/online-services/roads',
    government_website: 'https://chennaicorporation.gov.in',
    escalation_chain: ['Assistant Engineer (Ward)', 'Executive Engineer (Zone)', 'Superintending Engineer (Roads)', 'Municipal Commissioner'],
    keywords: ['pothole', 'road', 'crater', 'asphalt', 'cave-in', 'tar']
  },
  {
    category: 'garbage',
    department_name: 'Solid Waste Management & Sanitation Dept',
    service_name: 'Waste Clearance & Public Hygiene Service',
    ward: 'Ward 12',
    sla_hours: 48,
    officer_role: 'Chief Health Officer / Sanitation Inspector',
    portal_url: 'https://chennaicorporation.gov.in/gcc/online-services/swm',
    government_website: 'https://chennaicorporation.gov.in',
    escalation_chain: ['Sanitation Inspector (Ward)', 'Zonal Health Officer', 'Chief Urban Health Officer', 'Additional Commissioner (Health)'],
    keywords: ['garbage', 'trash', 'waste', 'dump', 'dustbin', 'overflowing', 'smell']
  },
  {
    category: 'streetlight',
    department_name: 'Electrical & Public Lighting Division',
    service_name: 'Streetlight Maintenance & Grid Service',
    ward: 'Ward 12',
    sla_hours: 24,
    officer_role: 'Assistant Executive Engineer (Electrical)',
    portal_url: 'https://www.tangedco.gov.in/public-lighting-grievances',
    government_website: 'https://www.tangedco.gov.in',
    escalation_chain: ['Junior Engineer (Electrical)', 'AEE (Distribution)', 'Superintending Engineer (Lighting)', 'Director of Operations'],
    keywords: ['streetlight', 'light', 'lamp', 'dark', 'pole', 'flicker', 'electricity']
  },
  {
    category: 'water_leak',
    department_name: 'Metropolitan Water Supply & Sewerage Board',
    service_name: 'Water Mains & Pipeline Repair Cell',
    ward: 'Ward 12',
    sla_hours: 12,
    officer_role: 'Superintending Engineer (Water Works)',
    portal_url: 'https://cmwssb.tn.gov.in/grievance-redressal',
    government_website: 'https://cmwssb.tn.gov.in',
    escalation_chain: ['Area Engineer (Ward)', 'Executive Engineer (Maintenance)', 'Superintending Engineer', 'Managing Director (CMWSSB)'],
    keywords: ['water', 'leak', 'pipe', 'burst', 'drainage', 'sewage', 'flooding']
  },
  {
    category: 'other',
    department_name: 'General Public Grievance Redressal Cell',
    service_name: 'Public Municipal Assistance Cell',
    ward: 'Ward 12',
    sla_hours: 48,
    officer_role: 'Public Relations Officer / Grievance Cell Officer',
    portal_url: 'https://chennaicorporation.gov.in/gcc/grievance',
    government_website: 'https://chennaicorporation.gov.in',
    escalation_chain: ['Grievance Officer', 'Zonal Officer', 'District Collectorate Liaison', 'Public Grievance Commissioner'],
    keywords: ['other', 'general', 'help', 'inquiry', 'public']
  }
];

async function seed() {
  try {
    await connectDB();
    console.log('[Seed] Connected to MongoDB.');

    // Seed Admin
    await Admin.deleteMany({});
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('admin123', salt);

    const admin = new Admin({
      admin_id: 'ADMIN001',
      name: 'Chief Municipal Admin',
      email: 'admin@civicresolve.gov.in',
      password_hash: password_hash,
      department: 'Central Municipal Operations',
      role: 'superadmin'
    });
    await admin.save();
    console.log('[Seed] Admin account created: ADMIN001 / admin123');

    // Seed Municipal Knowledge Base
    await KnowledgeBase.deleteMany({});
    await KnowledgeBase.insertMany(MUNICIPAL_KB_DATA);
    console.log('[Seed] Municipal Knowledge Base seeded with official portals.');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
}

seed();
