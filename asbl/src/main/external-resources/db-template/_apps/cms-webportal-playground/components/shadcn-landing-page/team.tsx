"use client"

 import Image from "next/image"
 import { buttonVariants } from "@/components/ui/button"
 import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
 } from "@/components/ui/card"
 import { Facebook, Instagram, Linkedin } from "lucide-react"

 interface TeamProps {
   imageUrl: string
   name: string
   position: string
   socialNetworks: SocialNetworkProps[]
 }

 interface SocialNetworkProps {
   name: string
   url: string
 }

 const teamList: TeamProps[] = [
   {
     imageUrl: "https://i.pravatar.cc/150?img=35",
     name: "Emma Smith",
     position: "Product Manager",
     socialNetworks: [
       {
         name: "Linkedin",
         url: "https://www.linkedin.com/in/leopoldo-miranda/",
       },
       {
         name: "Facebook",
         url: "https://www.facebook.com/",
       },
       {
         name: "Instagram",
         url: "https://www.instagram.com/",
       },
     ],
   },
   {
     imageUrl: "https://i.pravatar.cc/150?img=60",
     name: "John Doe",
     position: "Tech Lead",
     socialNetworks: [
       {
         name: "Linkedin",
         url: "https://www.linkedin.com/in/leopoldo-miranda/",
       },
       {
         name: "Facebook",
         url: "https://www.facebook.com/",
       },
       {
         name: "Instagram",
         url: "https://www.instagram.com/",
       },
     ],
   },
   {
     imageUrl: "https://i.pravatar.cc/150?img=36",
     name: "Ashley Ross",
     position: "Frontend Developer",
     socialNetworks: [
       {
         name: "Linkedin",
         url: "https://www.linkedin.com/in/leopoldo-miranda/",
       },
       {
         name: "Instagram",
         url: "https://www.instagram.com/",
       },
     ],
   },
   {
     imageUrl: "https://i.pravatar.cc/150?img=17",
     name: "Bruce Rogers",
     position: "Backend Developer",
     socialNetworks: [
       {
         name: "Linkedin",
         url: "https://www.linkedin.com/in/leopoldo-miranda/",
       },
       {
         name: "Facebook",
         url: "https://www.facebook.com/",
       },
     ],
   },
 ]

 export const LandingTeam = () => {
   const socialIcon = (iconName: string) => {
     switch (iconName) {
       case "Linkedin":
         return <Linkedin size="20" />
       case "Facebook":
         return <Facebook size="20" />
       case "Instagram":
         return <Instagram size="20" />
       default:
         return null
     }
   }

   return (
     <section
       id="team"
       className="container py-24 sm:py-32"
       aria-label="Our Team"
     >
       <h2 className="text-3xl md:text-4xl font-bold">
         <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
           Our Dedicated{" "}
         </span>
         Crew
       </h2>

       <p className="mt-4 mb-10 text-xl text-muted-foreground">
         Lorem ipsum dolor sit amet consectetur, adipisicing elit. Veritatis
         dolor pariatur sit!
       </p>

       <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 gap-y-10">
         {teamList.map(({ imageUrl, name, position, socialNetworks }) => (
           <Card
             key={name}
             className="bg-muted/50 relative mt-8 flex flex-col justify-center items-center"
           >
             <CardHeader className="mt-8 flex justify-center items-center pb-2">
               <div className="absolute -top-12 rounded-full w-24 h-24 aspect-square overflow-hidden">
                 <Image
                   src={imageUrl}
                   alt={`${name} ${position}`}
                   width={96}
                   height={96}
                   className="object-cover"
                 />
               </div>
               <CardTitle className="text-center">{name}</CardTitle>
               <CardDescription className="text-primary">
                 {position}
               </CardDescription>
             </CardHeader>

             <CardContent className="text-center pb-2">
               <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>
             </CardContent>

             <CardFooter className="flex gap-2">
               {socialNetworks.map(({ name, url }) => (
                 <a
                   key={name}
                   rel="noopener noreferrer"
                   href={url}
                   target="_blank"
                   className={buttonVariants({
                     variant: "ghost",
                     size: "sm",
                   })}
                   aria-label={`${name} profile`}
                 >
                   {socialIcon(name)}
                 </a>
               ))}
             </CardFooter>
           </Card>
         ))}
       </div>
     </section>
   )
 }