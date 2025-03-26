"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateImagePrompt, generateAllImagePrompts } from "@/services/aiService";
import Link from "next/link";
import { toast } from "sonner";
import { IMAGE_STYLE_PREFIX } from "@/lib/constants";

interface Scene {
  text: string;
  prompt: string;
}

export default function SceneVisualizer() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [basePrompt, setBasePrompt] = useState(IMAGE_STYLE_PREFIX);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    // Get script from localStorage instead of URL parameters
    const script = localStorage.getItem('scriptVizContent');
    
    if (!script) {
      toast.error("No script found. Please go back and enter your script.");
      return;
    }
    
    // Improved scene splitting algorithm based on sentences
    function splitScript(script: string, maxWordsPerSentence: number = 35): string[] {
      if (!script) return [];
      
      // Regular expression that respects honorifics (Mr., Mrs., Dr., etc.)
      const honorificsRegex = /(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|Rev|Sr|Jr|St|Sgt|Capt|Lt|Col|Gen|Adm|Sen|Rep|Gov|Atty|Supt|Det|Insp)\.)(?<=[.!?])\s+(?=[A-Z])/g;
      
      // Split script into sentences using regex that respects honorifics
      const sentences: string[] = script
          .split(honorificsRegex)
          .map(sentence => sentence.trim())
          .filter(sentence => sentence.length > 0);
      
      const scenes: string[] = [];
      
      // Process each sentence
      for (const sentence of sentences) {
        // Count words in the sentence
        const wordCount = sentence.split(/\s+/).filter(word => word.length > 0).length;
        
        // If sentence is longer than maxWordsPerSentence, split it
        if (wordCount > maxWordsPerSentence) {
          // Split long sentence into chunks of approximately equal size
          const words = sentence.split(/\s+/).filter(word => word.length > 0);
          const numChunks = Math.ceil(wordCount / maxWordsPerSentence);
          const wordsPerChunk = Math.ceil(wordCount / numChunks);
          
          for (let i = 0; i < numChunks; i++) {
            const start = i * wordsPerChunk;
            const end = Math.min(start + wordsPerChunk, words.length);
            if (start < words.length) {
              const chunk = words.slice(start, end).join(' ');
              scenes.push(chunk);
            }
          }
        } else {
          // Add the sentence as a scene
          scenes.push(sentence);
        }
      }
      
      return scenes;
    }
    
    // Use the improved algorithm to split the script into scenes
    const sceneTexts = splitScript(script);
    
    // Initialize scenes with empty prompts
    const initialScenes = sceneTexts.map(text => ({
      text,
      prompt: ""
    }));
    
    setScenes(initialScenes);
  }, []);

  const generatePrompt = async (sceneIndex: number) => {
    // This function now does nothing
    console.log("Generate button clicked - no action taken");
  };

  const prepareScene = async (sceneIndex: number) => {
    if (sceneIndex >= 0 && sceneIndex < scenes.length) {
      setIsPreparing(true);
      
      try {
        const scene = scenes[sceneIndex];
        
        // Get the previous prompt for context (if not the first scene)
        const previousPrompt = sceneIndex > 0 ? scenes[sceneIndex - 1].prompt : undefined;
        
        // Use the AI to generate a prompt
        let aiGeneratedPrompt = "";
        
        try {
          aiGeneratedPrompt = await generateImagePrompt({
            sceneText: scene.text,
            previousPrompt
          });
        } catch (error) {
          // If AI generation fails, use the base prompt as fallback
          console.error("AI preparation failed, using fallback:", error);
          aiGeneratedPrompt = `${basePrompt} ${scene.text} --16:9`;
          toast.error("AI preparation failed. Using default prompt.");
        }
        
        // Update the scene with the generated prompt
        const updatedScenes = [...scenes];
        updatedScenes[sceneIndex] = {
          ...scene,
          prompt: aiGeneratedPrompt
        };
        
        setScenes(updatedScenes);
        toast.success("Scene prepared!");
      } catch (error) {
        console.error("Error in scene preparation:", error);
        toast.error("Failed to prepare scene. Please try again.");
      } finally {
        setIsPreparing(false);
      }
    }
  };

  const copyPromptToClipboard = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success("Copied to clipboard!");
  };


  const generateAllPrompts = async () => {
    // This function now does nothing
    console.log("Generate All button clicked - no action taken");
  };

  const prepareAllScenes = async () => {
    setIsPreparing(true);
    
    try {
      // Use the service to generate all prompts at once
      const updatedScenes = await generateAllImagePrompts(scenes);
      setScenes(updatedScenes);
      toast.success("All scenes prepared!");
    } catch (error) {
      console.error("Error preparing all scenes:", error);
      toast.error("Failed to prepare all scenes. Please try again.");
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <header className="bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-sm border-b border-gray-800 py-4 sticky top-0 z-10 shadow-lg">
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
            
            <div className="flex items-center">
              {/* Generate All button on desktop only */}
              <div className="hidden sm:block mr-2">
                <Button 
                  onClick={generateAllPrompts}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-6 py-2 rounded-md transition-all shadow-md hover:shadow-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="truncate">Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate">Generate All</span>
                    </>
                  )}
                </Button>
              </div>
              {/* Prepare All button on desktop only */}
              <div className="hidden sm:block mr-2">
                <Button 
                  onClick={prepareAllScenes}
                  disabled={isPreparing}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-6 py-2 rounded-md transition-all shadow-md hover:shadow-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
                >
                  {isPreparing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="truncate">Preparing...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate">Prepare All</span>
                    </>
                  )}
                </Button>
              </div>
              <Link href="/">
                <Button 
                  variant="outline" 
                  className="bg-transparent hover:bg-gray-800 text-gray-300 border border-gray-700 rounded-md transition-all hover:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate">Back</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Scene list - becomes tabs on mobile */}
          <div className="w-full lg:w-1/3 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4 sm:p-5 lg:h-[calc(100vh-180px)] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 011-1h2a1 1 0 110 2H9v7a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1 1 1 0 012 0v.34a4 4 0 001.576 2.812l-3.632 7.283A4 4 0 0011 16V9a1 1 0 012 0v7a1 1 0 01-2 0V9.34a4 4 0 00-1.576-2.812L7 5.5a1 1 0 00-1-1z" />
                </svg>
                Scenes ({scenes.length})
              </h2>
              
              {/* Show Generate All button on mobile next to Scenes heading */}
              <div className="block sm:hidden">
                <Button 
                  onClick={generateAllPrompts}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-all shadow-md hover:shadow-lg flex items-center gap-1 text-xs"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="truncate">Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate">Generate All</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Mobile scene navigation */}
            <div className="flex lg:hidden justify-between items-center mb-3 bg-gray-800/30 rounded-lg p-2">
              <Button
                variant="outline"
                onClick={() => setSelectedSceneIndex(Math.max(0, selectedSceneIndex - 1))}
                disabled={selectedSceneIndex === 0}
                className="bg-transparent hover:bg-gray-800 text-gray-300 border border-gray-700 rounded-md transition-all hover:text-white disabled:opacity-50 disabled:cursor-not-allowed h-9 w-9 p-0 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </Button>
              <span className="text-gray-300 font-medium">Scene {selectedSceneIndex + 1} of {scenes.length}</span>
              <Button
                variant="outline"
                onClick={() => setSelectedSceneIndex(Math.min(scenes.length - 1, selectedSceneIndex + 1))}
                disabled={selectedSceneIndex === scenes.length - 1}
                className="bg-transparent hover:bg-gray-800 text-gray-300 border border-gray-700 rounded-md transition-all hover:text-white disabled:opacity-50 disabled:cursor-not-allowed h-9 w-9 p-0 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
            
            {/* Scene list - hidden on small screens */}
            <div className="space-y-3 hidden lg:block">
              {scenes.map((scene, index) => (
                <div 
                  key={index}
                  className={`p-3 sm:p-4 rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    selectedSceneIndex === index 
                      ? "bg-gradient-to-r from-blue-900/70 to-blue-800/50 border border-blue-700/50 shadow-lg" 
                      : "bg-gray-800/50 border border-gray-700/30 hover:bg-gray-800/80"
                  }`}
                  onClick={() => setSelectedSceneIndex(index)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-medium ${selectedSceneIndex === index ? "text-blue-300" : "text-gray-300"}`}>
                      Scene {index + 1}
                    </span>
                    {scene.prompt ? (
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                        <span className="text-xs text-green-400">Ready</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-gray-500 mr-1"></div>
                        <span className="text-xs text-gray-400">Pending</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm line-clamp-2 text-gray-400">{scene.text}</p>
                </div>
              ))}
            </div>
            
            {/* Mobile current scene preview */}
            <div className="lg:hidden">
              {scenes.length > 0 && selectedSceneIndex < scenes.length && (
                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-900/70 to-blue-800/50 border border-blue-700/50 shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-blue-300">
                      Scene {selectedSceneIndex + 1}
                    </span>
                    {scenes[selectedSceneIndex].prompt ? (
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                        <span className="text-xs text-green-400">Ready</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-gray-500 mr-1"></div>
                        <span className="text-xs text-gray-400">Pending</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm line-clamp-3 text-gray-400">{scenes[selectedSceneIndex].text}</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-2/3">
            {scenes.length > 0 && selectedSceneIndex < scenes.length && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4 sm:p-6 shadow-xl hidden lg:block">
                  <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    Scene {selectedSceneIndex + 1}
                  </h2>
                  <p className="text-gray-300 whitespace-pre-wrap bg-gray-800/50 p-3 sm:p-4 rounded-lg border border-gray-700/30">{scenes[selectedSceneIndex].text}</p>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4 sm:p-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Image Prompt
                    </h2>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => generatePrompt(selectedSceneIndex)}
                        disabled={isGenerating}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all shadow-md hover:shadow-lg flex items-center gap-1 sm:gap-2 flex-1 sm:flex-auto justify-center"
                      >
                        {isGenerating ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="truncate">Generating...</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                            <span className="truncate">Generate</span>
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={() => prepareScene(selectedSceneIndex)}
                        disabled={isPreparing}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-md transition-all shadow-md hover:shadow-lg flex items-center gap-1 sm:gap-2 flex-1 sm:flex-auto justify-center"
                      >
                        {isPreparing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="truncate">Preparing...</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                            <span className="truncate">Prepare</span>
                          </>
                        )}
                      </Button>
                      {scenes[selectedSceneIndex].prompt && (
                        <Button 
                          variant="outline"
                          onClick={() => copyPromptToClipboard(scenes[selectedSceneIndex].prompt)}
                          className="bg-transparent hover:bg-gray-800 text-gray-300 border border-gray-700 rounded-md transition-all hover:text-white flex items-center gap-1 sm:gap-2 flex-1 sm:flex-auto justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                            <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                          </svg>
                          <span className="truncate">Copy</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {scenes[selectedSceneIndex].prompt ? (
                    <div className="p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700/30 min-h-[120px]">
                      <p className="text-gray-300 font-mono text-sm sm:text-base break-words">{scenes[selectedSceneIndex].prompt}</p>
                    </div>
                  ) : (
                    <div className="p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700/30 min-h-[120px] flex items-center justify-center">
                      <p className="text-gray-500 italic flex items-center text-sm sm:text-base text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Click "Generate" to create an image prompt
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between hidden lg:flex">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSceneIndex(Math.max(0, selectedSceneIndex - 1))}
                    disabled={selectedSceneIndex === 0}
                    className="bg-transparent hover:bg-gray-800 text-gray-300 border border-gray-700 rounded-md transition-all hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Previous Scene
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSceneIndex(Math.min(scenes.length - 1, selectedSceneIndex + 1))}
                    disabled={selectedSceneIndex === scenes.length - 1}
                    className="bg-transparent hover:bg-gray-800 text-gray-300 border border-gray-700 rounded-md transition-all hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next Scene
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="mt-auto py-4 text-center text-gray-500 text-sm">
        <p>ScriptViz {new Date().getFullYear()} - Create better visuals for your content</p>
      </footer>
    </div>
  );
}
