import { prisma } from '../src/lib/prisma.js';

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

    //Seed the plans
    await prisma.plan.createMany({
        data: [
            {name: "MONTHLY", duration: 1, price: 2000},
            {name: "QUARTERLY", duration: 3, price: 5400},   //comes to 1800 a month
            {name: "MONTHLY", duration: 6, price: 9000},  //comes to 1500 a month
            {name: "MONTHLY", duration: 12, price: 14400}   //comes to 1200
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
    console.log("Seeded Facilities!")
}

main()