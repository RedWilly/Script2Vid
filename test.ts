function splitScript(script: string, maxWordsPerScene: number = 21): string {
    if (!script || maxWordsPerScene < 1) return "";
    
    // Split script into sentences using improved regex
    const sentences: string[] = script
        .split(/(?<=[.!?])\s+(?=[A-Z])/g)
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 0);
    
    if (sentences.length === 0) {
        sentences.push(script.trim());
    }
    
    // Split into words to determine scene count
    const words: string[] = script.split(/\s+/).filter(word => word.length > 0);
    const totalWords: number = words.length;
    if (totalWords === 0) return "";
    
    const numScenes: number = Math.ceil(totalWords / maxWordsPerScene);
    const wordsPerScene: number = Math.ceil(totalWords / numScenes);
    const scenes: string[] = [];
    
    for (let i = 0; i < numScenes; i++) {
        const start: number = i * wordsPerScene;
        const end: number = Math.min(start + wordsPerScene, totalWords);
        if (start >= totalWords) break;
        const sceneText: string = words.slice(start, end).join(' ').trim();
        scenes.push(`Scene ${i + 1}\n${sceneText}`);
    }
    
    return scenes.join("\n\n");
}

// Example Usage
let script: string = `In the winter of 2047, beneath the snow-dusted peaks of the Swiss Alps, a team of physicists at the European Quantum Research Collective made a discovery that would unravel humanity’s understanding of its place in the cosmos. It began as a routine calibration of the Chronos Array, a prototype detector designed to map quantum entanglement fluctuations across spacetime. The machine’s purpose was purely theoretical: to test whether subatomic particles could retain “memory” of their entangled partners after separation. But on the evening of December 12th, the array detected something its creators had not anticipated—a gravitational anomaly, faint but persistent, pulsing like a phantom heartbeat just outside the boundaries of measurable reality.`;

let formattedScenes: string = splitScript(script);
console.log(formattedScenes);