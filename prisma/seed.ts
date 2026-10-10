import { prisma } from '../src/lib/prisma.js';
import { env } from '../src/config/env.js';
import { hashPassword } from '../src/utils/password.js';
import { RoleName, PlanTypes, FacilityTypes, MembershipTypes } from '../src/generated/prisma/enums.js';


const passwordHash = await hashPassword(env.ADMIN_SECRET);

async function main(){
    await prisma.$transaction(async (tx) => {
        // Seed the roles
        await tx.role.createMany({
            data: [
                {name: "ADMIN"},
                {name: "COACH"},
                {name: "MEMBER"},
                {name: "STAFF"}
            ]
        });
        console.log("Seeded Roles!")
        
        //Seed the permissions
        await tx.permission.createMany({
            data: [
                { action : "absolute"},

                { action: "users:read:any" },
                { action: "users:update:any" },
                { action: "users:delete:any" },
                { action: "users:logoutall:any"},
    
                { action: "users:read:own"},
                { action: "users:update:own"},
                { action: "users:delete:own"},
    
                { action: "plans:read:any" },
                { action: "plans:create:any" },
                { action: "plans:update:any" },
                { action: "plans:delete:any" },
    
                { action: "subscriptions:read:any" },
                { action: "subscriptions:create:any" },
                { action: "subscriptions:update:any" },
                { action: "subscriptions:delete:any" },
                { action: "subscriptions:cancel:any" },
    
                { action: "subscriptions:read:own" },
                { action: "subscriptions:create:own" },
                { action: "subscriptions:cancel:own" },
    
                { action: "payments:read:any" },
                { action: "payments:create:any" },
                { action: "payments:update:any" },
                { action: "payments:delete:any" },
    
                { action: "payments:read:own" },
                { action: "payments:update:own" },
                { action: "payments:cancel:own" },
    
                { action: "facilities:read:any" },
                { action: "facilities:create:any" },
                { action: "facilities:update:any" },
                { action: "facilities:delete:any" },
    
                { action: "session:read:any" },
                { action: "session:create:any" },
                { action: "session:update:any" },
                { action: "session:delete:any" },
    
                { action: "session:read:own" },
                { action: "session:create:own" },
                { action: "session:update:own" },
            ]
        });
        console.log("Seeded Permissions!");
    
        //Seed the rolePermissions, but first seed the roles and permissions
        for (const [role, permissions] of Object.entries(rolePermissions)) {
            for (const permission of permissions) {
                await tx.rolePermission.create({
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
        await tx.plan.createMany({
            data: [
                {name: "BASIC"},
                {name: "PREMIUM"}
            ]
        });
        console.log("Seeded Plans!")
    
        //Seed the facilities
        await tx.facility.createMany({
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
                await tx.planFacility.create({
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
        
        //Seed the planPrice
        for(const [plan, values] of Object.entries(planPrices)){
            for(const value of values){
                for(const [membership, price] of Object.entries(value)){
                    await tx.planPrice.create({
                        data: {
                            plan: {
                                connect: {name: plan as PlanTypes}
                            },
                            membership: membership as MembershipTypes,
                            price: price
                        } 
                    })
                };
            };
        };
        console.log("Seeded planPrices!");
    
        //Seed an ADMIN user, but first seed the role
        await tx.user.create({
                data: {
                    name: "Eyosiyas",
                    email: "eyosik55@gmail.com",
                    role: {
                        connect: {
                            name: "ADMIN"
                        }
                    },
                    passwordHash: passwordHash
                }
            });
        console.log("Seeded an ADMIN user!");
    });
};

main()
    .catch((error) => {
        console.error("Seeding Failed", error.message);
        process.exitCode = 1;
    }).finally(async () => {
        await prisma.$disconnect();
    });

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
    "absolute",

    "users:read:any",
    "users:update:any",
    "users:delete:any",
    "users:logoutall:any",

    "plans:read:any",
    "plans:create:any",
    "plans:update:any",
    "plans:delete:any",

    "subscriptions:read:any",
    "subscriptions:create:any",
    "subscriptions:update:any",
    "subscriptions:delete:any",

    "payments:read:any",
    "payments:create:any",
    "payments:update:any",
    "payments:delete:any",
    
    "facilities:read:any",
    "facilities:create:any",
    "facilities:update:any",
    "facilities:delete:any",

    "session:read:any",
    "session:create:any",
    "session:update:any",
    "session:delete:any",
  ],

  STAFF: [
    "users:read:any",
    "users:update:any",

    "plans:read:any",

    "subscriptions:read:any",
    "subscriptions:create:any",
    "subscriptions:update:any",

    "payments:read:any",
    "payments:update:any",

    "facilities:read:any",

    "session:read:any",
    "session:create:any",
    "session:update:any",
  ],

  COACH: [
    "users:read:any",

    "plans:read:any",

    "subscriptions:read:any",

    "facilities:read:any",

    "session:read:any",
  ],

  MEMBER: [
    "users:read:own",
    "users:update:own",
    "users:delete:own",

    "subscriptions:read:own",
    "subscriptions:create:own",
    "subscriptions:cancel:own",

    "payments:read:own",
    "payments:update:own",
    "payments:cancel:own",

    "session:read:own",
    "session:create:own",
    "session:update:own",
  ],
};

const planPrices = {
    BASIC: [
        {MONTHLY:"1000"},
        {QUARTERLY:"2700"},
        {HALF_YEARLY:"4800"},
        {YEARLY:"6000"}
    ],
    PREMIUM: [
        {MONTHLY:"2000"},
        {QUARTERLY:"5400"},
        {HALF_YEARLY:"9600"},
        {YEARLY:"12000"}
    ]
};
