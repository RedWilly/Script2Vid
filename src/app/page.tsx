"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Home() {
  const [script, setScript] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!script.trim()) {
      toast.error("Please enter your script before proceeding");
      return;
    }

    // Store the script in localStorage instead of URL parameters to handle very long scripts
    localStorage.setItem('scriptVizContent', script);
    
    // Navigate to scene-visualizer without the script as a query parameter
    router.push('/scene-visualizer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col">
      <header className="bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-sm border-b border-gray-800 py-4 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-400">Script</span>
                <span className="text-white">Viz</span>
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-3 sm:mb-4">
              <span className="text-blue-400">Script</span>
              <span className="text-white">Viz</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto px-2">
              Transform your script into visual segments with AI-powered prompts
            </p>
          </div>
          
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-5 sm:p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div className="space-y-2 sm:space-y-3">
                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  Enter Your Script
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Paste your YouTube video script below. The tool will automatically segment it into visual prompts.
                </p>
                <Textarea
                  id="script"
                  placeholder="Paste your script here..."
                  className="min-h-[180px] sm:min-h-[200px] p-3 sm:p-4 text-sm sm:text-base resize-y bg-gray-800/50 border border-gray-700/30 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                />
              </div>
              
              <div className="bg-gray-800/30 p-4 sm:p-6 rounded-lg border border-gray-700/30">
                <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  How It Works:
                </h3>
                <ol className="space-y-1 sm:space-y-2 list-decimal list-inside text-gray-400 text-xs sm:text-sm">
                  <li>Paste your full YouTube video script into the text area above</li>
                  <li>The system will automatically divide your script into segments of 18 words each</li>
                  <li>For each segment, an image prompt will be generated with a consistent style</li>
                  <li>Use these prompts to create visuals that match perfectly with your script timing</li>
                </ol>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 rounded-md transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
                >
                  <span>Next</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      <footer className="py-4 text-center text-gray-500 text-xs sm:text-sm">
        <p>ScriptViz {new Date().getFullYear()} - Create better visuals for your content</p>
      </footer>
    </div>
  );
}
