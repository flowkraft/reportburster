import { Button, buttonVariants } from "@/components/ui/button";
 import { LandingHeroCards } from "./hero-cards";
 import { GitHubLogoIcon } from "@radix-ui/react-icons";
 import Link from "next/link";

 export const LandingHero = () => {
   return (
     <section className="container grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-10">
       <div className="text-center lg:text-start space-y-6">
         <main className="text-5xl md:text-6xl font-bold">
           <h1 className="inline">
             <span className="inline bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">     
               Shadcn
             </span>{" "}
             landing page
           </h1>{" "}
           for{" "}
           <h2 className="inline">
             <span className="inline bg-gradient-to-r from-[#61DAFB] via-[#1fc0f1] to-[#03a3d7] text-transparent      
 bg-clip-text">
               React
             </span>{" "}
             developers
           </h2>
         </main>

         <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
           Build your React landing page effortlessly with the required sections
           to your project.
         </p>

         <div className="space-y-4 md:space-y-0 md:space-x-4">
           <Button className="w-full md:w-1/3">Get Started</Button>

           <Link
             href="https://github.com/leoMirandaa/shadcn-landing-page.git"
             target="_blank"
             rel="noopener noreferrer"
             className={`w-full md:w-1/3 ${buttonVariants({
               variant: "outline",
             })}`}
           >
             Github Repository
             <GitHubLogoIcon className="ml-2 w-5 h-5" />
           </Link>
         </div>
       </div>

       {/* Hero cards sections */}
       <div className="z-10">
         <LandingHeroCards />
       </div>

       {/* Shadow effect */}
       <div className="shadow"></div>
     </section>
   );
 };
