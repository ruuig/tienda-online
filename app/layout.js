import { Outfit } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import AddToCartNotification from "@/src/presentation/components/AddToCartNotification";

const outfit = Outfit({ subsets: ['latin'], weight: ["300", "400", "500"] })

export const metadata = {
  title: "RJG Tech Shop - UMG",
  description: "Tu tienda en línea con asistente de soporte inteligente",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${outfit.className} antialiased text-gray-700`} >
          <Toaster />
          <AppContextProvider>
            <AddToCartNotification />
            {children}
          </AppContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
