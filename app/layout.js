import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

 const inter = Inter({ subsets: ["latin"]});
export const metadata = {
  title: "Vapra Workshop",
  description: "Connect with us Anytime, Anywhere!",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider 
     appearance={{
      baseTheme: dark,
     }}>
    <html lang="en" suppressHydrationWarning >
      <body className={`${inter.className}`}>
         <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
             {/* header */}
             <Header />

        <main className="min-h-screen">
        {children}
        </main>

        {/* footer */}
        <footer className="bg-gray-900 text-gray-100 py-16 border-t border-gray-800">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {/* About */}
              <div>
                <h3 className="text-xl font-bold text-emerald-400 mb-4">Vapra Workshop</h3>
                <p className="text-gray-400 mb-4">
                  Your trusted automotive service center providing professional vehicle maintenance and repair solutions.
                </p>
                <div className="flex gap-4">
                  <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 002.856-3.915 9.953 9.953 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                  </a>
                  <a href="https://www.instagram.com/wapra_workshop_bkn/?hl=en" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37Z" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>
                  </a>
                  <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-xl font-bold text-emerald-400 mb-4">Contact Us</h3>
                <div className="space-y-3 text-gray-400">
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <a href="tel:08460199154" className="hover:text-emerald-400 transition font-semibold">
                      08460199154
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p>Old Chungi Chowki, Gajner Road<br/>Bikaner, Rajasthan 334002</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hours</p>
                    <p>Mon - Sun: 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div>
                <h3 className="text-xl font-bold text-emerald-400 mb-4">Location</h3>
                <div className="rounded-lg overflow-hidden h-48">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3556.1234567890!2d73.31234567!3d27.9!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sVapra%20Workshop!5e0!3m2!1sen!2sin!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            </div>

            {/* Bottom Divider and Copyright */}
            <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
              <p>© 2026 Vapra Workshop. All rights reserved.</p>
              <p className="mt-2">
                <a href="https://jsdl.in/DT-992EII6Q62E" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition">
                  Visit our Google Map
                </a>
              </p>
            </div>
          </div>
        </footer>
          </ThemeProvider>
       
         </body>
    </html>
    </ClerkProvider>
  );
}
