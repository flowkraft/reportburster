"use client"

 interface StatsProps {
   quantity: string
   description: string
 }

 export const LandingStatistics = () => {
   const stats: StatsProps[] = [
     {
       quantity: "2.7K+",
       description: "Users",
     },
     {
       quantity: "1.8K+",
       description: "Subscribers",
     },
     {
       quantity: "112",
       description: "Downloads",
     },
     {
       quantity: "4",
       description: "Products",
     },
   ]

   return (
     <section
       id="statistics"
       className="container py-24 sm:py-32"
       aria-label="Statistics"
     >
       <div
         className="grid grid-cols-2 lg:grid-cols-4 gap-8"
         role="list"
       >
         {stats.map(({ quantity, description }: StatsProps) => (
           <div
             key={description}
             className="space-y-2 text-center"
             role="listitem"
           >
             <h2 className="text-3xl sm:text-4xl font-bold">
               {quantity}
             </h2>
             <p className="text-xl text-muted-foreground">
               {description}
             </p>
           </div>
         ))}
       </div>
     </section>
   )
 }
