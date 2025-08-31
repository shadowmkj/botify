import { prisma } from "./prisma";

async function main() {
  const group = await prisma.contactGroup.findFirst()
  const user = await prisma.user.findFirst()
  const data = Array.from({ length: 10 }).map((_, i) => {
    return {
      name: `Nibha_${i}`,
      phone: "+918943025837",
      contactGroupId: group?.id!,
      userId: user?.id!
    }
  })
  console.log(data)
  await prisma.contact.createMany({
    data: data
  })
}

main().then(() => {
  console.log('Seeding completed')
}).catch((e) => { })

