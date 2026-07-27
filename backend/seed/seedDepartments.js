const connectDB = require('../config/db');
const { disconnectDB } = connectDB;
const Department = require('../models/Department');

const sampleDepartments = [
  {
    category: "pothole",
    ward: "Ward 1",
    department: "Roads & Civil Works Dept",
    contact: "roads-ward1@civic.gov.in"
  },
  {
    category: "pothole",
    ward: "Ward 2",
    department: "Roads & Infrastructure Dept",
    contact: "roads-ward2@civic.gov.in"
  },
  {
    category: "garbage",
    ward: "Ward 1",
    department: "Solid Waste Management Dept",
    contact: "sanitation-ward1@civic.gov.in"
  },
  {
    category: "garbage",
    ward: "Ward 3",
    department: "Public Health & Sanitation Dept",
    contact: "sanitation-ward3@civic.gov.in"
  },
  {
    category: "streetlight",
    ward: "Ward 1",
    department: "Electrical & Lighting Dept",
    contact: "lighting-ward1@civic.gov.in"
  },
  {
    category: "streetlight",
    ward: "Ward 2",
    department: "Electrical Services Dept",
    contact: "lighting-ward2@civic.gov.in"
  },
  {
    category: "water_leak",
    ward: "Ward 1",
    department: "Water Supply & Sewerage Board",
    contact: "water-ward1@civic.gov.in"
  },
  {
    category: "water_leak",
    ward: "Ward 3",
    department: "Water Works Dept",
    contact: "water-ward3@civic.gov.in"
  },
  {
    category: "other",
    ward: "Ward 1",
    department: "General Grievance Cell",
    contact: "helpline@civic.gov.in"
  },
  {
    category: "other",
    ward: "Ward 2",
    department: "Municipal Public Cell",
    contact: "public-help@civic.gov.in"
  }
];

const seedDepartments = async () => {
  try {
    await connectDB();
    await Department.deleteMany({});
    console.log('[Seed] Cleared existing Department records');

    const inserted = await Department.insertMany(sampleDepartments);
    console.log(`[Seed] Successfully inserted ${inserted.length} sample department records.`);

    await disconnectDB();
    console.log('[Seed] Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Error seeding departments: ${error.message}`);
    process.exit(1);
  }
};

seedDepartments();
