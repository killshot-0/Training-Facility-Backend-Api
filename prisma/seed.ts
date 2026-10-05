import { prisma } from '../src/lib/prisma.js';
import { RoleName, PlanTypes, FacilityTypes } from '../src/generated/prisma/enums.js';

async function main(){
    // Seed the roles
    // await prisma.role.createMany({
    //     data: [
    //         {name: "ADMIN"},
    //         {name: "COACH"},
    //         {name: "MEMBER"},
    //         {name: "STAFF"}
    //     ]
    // });
    // console.log("Seeded Roles!")
    
    //Seed the permissions
    await prisma.permission.createMany({
        data: [
            { action: "users:read" },
            { action: "users:create" },
            { action: "users:update" },
            { action: "users:delete" },

            { action: "plans:read" },
            { action: "plans:create" },
            { action: "plans:update" },
            { action: "plans:delete" },

            { action: "subscriptions:read" },
            { action: "subscriptions:create" },
            { action: "subscriptions:update" },
            { action: "subscriptions:cancel" },

            { action: "payments:read" },
            { action: "payments:create" },

            { action: "facilities:read" },
            { action: "facilities:update" },

            { action: "attendance:read" },
            { action: "attendance:manage" }
        ]
    });
    console.log("Seeded Permissions!");

    //Seed the rolePermissions, but first seed the roles and permissions
    for (const [role, permissions] of Object.entries(rolePermissions)) {
        for (const permission of permissions) {
            await prisma.rolePermission.create({
                data: {
                    role: {
                        connect: { name: role as RoleName}
                    },
                    permission: {
                        connect: { action: permission}
                    }
                }
            });
        }
    };
    console.log("Seeded rolePermissions!");

    //Seed the plans
    await prisma.plan.createMany({
        data: [
            {name: "BASIC",  price: 2000},
            {name: "PREMIUM", price: 4000}
        ]
    });
    console.log("Seeded Plans!")

    //Seed the facilities
    await prisma.facility.createMany({
        data: [
            {name: "GYM"},
            {name: "FOOTBALL"},
            {name: "SWIMMING_POOL"},
            {name: "SAUNA"},
            {name: "SHOWER"}
        ]
    });
    console.log("Seeded Facilities!");

    // Seed the planFacilities, but first seed the plan and facilities
    for(const [plan, facilities] of Object.entries(planFacilities)){
        for(const facility of facilities){
            await prisma.planFacility.create({
                data: {
                    plan: {
                        connect: {name: plan as PlanTypes}
                    },
                    facility: {
                        connect: {name: facility as FacilityTypes}
                    }
                } 
            });
        }
    }
    console.log("Seeded planFacilities!");

    //Seed an ADMIN user, but first seed the role
    await prisma.user.create({
            data: {
                name: "Eyosiyas",
                email: "eyosik55@gmail.com",
                role: {
                    connect: {
                        name: "ADMIN"
                    }
                }
            }
        });
    console.log("Seeded an ADMIN user!");
}

main();

const planFacilities = {
    BASIC: [
        "GYM",
        "SHOWER"
    ],
    PREMIUM: [
        "GYM",
        "FOOTBALL",
        "SWIMMING_POOL",
        "SAUNA",
        "SHOWER"
    ]
};

const rolePermissions = {
  ADMIN: [
    "users:read",
    "users:create",
    "users:update",
    "users:delete",

    "plans:read",
    "plans:create",
    "plans:update",
    "plans:delete",

    "subscriptions:read",
    "subscriptions:create",
    "subscriptions:update",
    "subscriptions:cancel",

    "payments:read",
    "payments:create",

    "facilities:read",
    "facilities:update",

    "attendance:read",
    "attendance:manage",
  ],

  STAFF: [
    "users:read",
    "users:update",

    "plans:read",

    "subscriptions:read",
    "subscriptions:create",
    "subscriptions:update",
    "subscriptions:cancel",

    "payments:read",
    "payments:create",

    "facilities:read",

    "attendance:read",
    "attendance:manage",
  ],

  COACH: [
    "users:read",

    "plans:read",

    "subscriptions:read",

    "facilities:read",

    "attendance:read",
    "attendance:manage",
  ],

  MEMBER: [
    "users:read",

    "plans:read",

    "subscriptions:read",
    "subscriptions:create",

    "payments:read",

    "facilities:read",

    "attendance:read",
  ],
};