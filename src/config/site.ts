export const SITE_CONFIG = {
  name: "VOLTLOOP",
  tagline: "Turn idle chargers into a charging network.",
  secondaryTagline: "Community-powered EV charging, wherever the road takes you.",
  mission: "We don't build more chargers. We unlock the chargers that already exist.",
  problemStatement: "Private EV chargers are an underutilized infrastructure asset, while EV travelers — especially outside major cities — may struggle to find reliable overnight charging.",
  demoUser: {
    userId: "user-demo-01",
    name: "Aarav Sharma",
    email: "demo@voltloop.app",
    phone: "+91 98201 54321",
    role: "BOTH" as const,
    activeVehicleId: "veh-01"
  },
  defaultEfficiency: 0.90, // 90% charging efficiency
  platformFeeDefault: 12, // in INR
};
