'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { encryptAsconForVisualization, decryptAsconForVisualization, StateStep, bytesToText, hexToBytes, ROUND_CONSTANTS } from '../lib/ascon';

export default function AsconVisualizer() {
  const [input, setInput] = useState('');
  const [key, setKey] = useState('ASCON visualization key');
  const [nonce, setNonce] = useState('ASCON nonce');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<StateStep[]>([]);
  const [animationSpeed, setAnimationSpeed] = useState(1000); // ms per step
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [ciphertext, setCiphertext] = useState('');
  const [result, setResult] = useState('');
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Generate steps when input changes
  useEffect(() => {
    if (mode === 'encrypt' && input) {
      const encryptionSteps = encryptAsconForVisualization(input, key, nonce);
      setSteps(encryptionSteps);
      setCurrentStepIndex(0);
      
      // Set the final ciphertext
      if (encryptionSteps.length > 0) {
        const finalStep = encryptionSteps[encryptionSteps.length - 1];
        if (finalStep.ciphertext) {
          setCiphertext(finalStep.ciphertext);
          setResult(finalStep.ciphertext);
        }
      }
    } else if (mode === 'decrypt' && input) {
      try {
        const decryptionSteps = decryptAsconForVisualization(input, key, nonce);
        setSteps(decryptionSteps);
        setCurrentStepIndex(0);
        
        // Set the final plaintext
        if (decryptionSteps.length > 0) {
          const finalStep = decryptionSteps[decryptionSteps.length - 1];
          if (finalStep.plaintext) {
            setResult(finalStep.plaintext);
          }
        }
      } catch (error) {
        console.error('Error decrypting:', error);
        setSteps([]);
      }
    } else {
      setSteps([]);
      setCurrentStepIndex(0);
      setResult('');
    }
  }, [input, key, nonce, mode]);

  // Handle play/pause animation
  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      animationRef.current = setTimeout(() => {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, animationSpeed);
    }
    
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isPlaying, currentStepIndex, steps.length, animationSpeed]);

  const handlePlayPause = () => {
    if (steps.length === 0 && input) {
      if (mode === 'encrypt') {
        const encryptionSteps = encryptAsconForVisualization(input, key, nonce);
        setSteps(encryptionSteps);
      } else {
        try {
          const decryptionSteps = decryptAsconForVisualization(input, key, nonce);
          setSteps(decryptionSteps);
        } catch (error) {
          console.error('Error decrypting:', error);
          return;
        }
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleStepForward = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleModeChange = (newMode: 'encrypt' | 'decrypt') => {
    if (newMode !== mode) {
      setMode(newMode);
      setInput('');
      setSteps([]);
      setCurrentStepIndex(0);
      setResult('');
      setIsPlaying(false);
    }
  };

  const handleUseResult = () => {
    setInput(result);
    setMode(mode === 'encrypt' ? 'decrypt' : 'encrypt');
    setSteps([]);
    setCurrentStepIndex(0);
    setResult('');
  };

  // Format state for display
  const formatStateWord = (word: number) => {
    return '0x' + word.toString(16).padStart(16, '0');
  };

  const currentStep = steps[currentStepIndex];

  // Get a simple description for the current step
  const getSimpleDescription = () => {
    if (!currentStep) return "";
    
    const stepInfo = currentStep.step;
    const substep = currentStep.substep;
    
    if (stepInfo.includes("Initial state")) {
      return mode === 'encrypt' 
        ? "Starting with an empty container" 
        : "Starting the decryption process";
    }
    if (stepInfo.includes("initialization with IV")) {
      return mode === 'encrypt'
        ? "Adding your secret key and a unique identifier to the mix"
        : "Setting up the decryption with your key and identifier";
    }
    if (stepInfo.includes("Permutation") && substep === "Addition of round constant") {
      return "Adding special numbers to make the encryption stronger";
    }
    if (stepInfo.includes("Permutation") && substep === "Substitution layer") {
      return "Replacing values with new values to increase security";
    }
    if (stepInfo.includes("Permutation") && substep === "Linear diffusion layer") {
      return "Stirring everything to spread changes throughout";
    }
    if (stepInfo.includes("Processing plaintext")) {
      return "Converting your message into ciphertext";
    }
    if (stepInfo.includes("Processing ciphertext")) {
      return "Recovering the original message from ciphertext";
    }
    if (stepInfo.includes("Permutation between blocks")) {
      return "Stirring everything again for extra security";
    }
    if (stepInfo.includes("Finalization")) {
      return "Finishing up by adding your secret key again";
    }
    if (stepInfo.includes("Final permutation")) {
      return "One last mixing round to secure everything";
    }
    if (stepInfo.includes("Final state")) {
      return mode === 'encrypt'
        ? "Your message is now fully encrypted and authenticated!"
        : "Your message has been successfully decrypted!";
    }
    
    return stepInfo;
  };

  // For rendering individual characters with their transformations
  const renderCharTransformation = (index: number) => {
    if (!currentStep) return null;
    
    if (mode === 'encrypt') {
      // For encryption: show plaintext → ciphertext
      if (currentStep.plaintextChar && currentStep.ciphertextChar && 
          currentStep.step.includes("Processing plaintext") && 
          currentStep.roundNumber === index) {
        return (
          <motion.div 
            className="flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/20 p-2 rounded"
            key={`transform-${index}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-sm font-semibold mb-1">Current Transformation</div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded text-center">
                <div className="text-xs text-gray-500 mb-1">Plaintext</div>
                <div className="font-mono">
                  <span className="text-xl">{currentStep.plaintextChar}</span>
                  <div className="text-xs mt-1">Hex: {currentStep.plaintextHex}</div>
                </div>
              </div>
              <motion.div 
                animate={{ x: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </motion.div>
              <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded text-center">
                <div className="text-xs text-gray-500 mb-1">Ciphertext</div>
                <div className="font-mono">
                  <span className="text-xl">{currentStep.ciphertextChar}</span>
                  <div className="text-xs mt-1">Hex: {currentStep.ciphertextHex}</div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      }
    } else {
      // For decryption: show ciphertext → plaintext
      if (currentStep.plaintextChar && currentStep.ciphertextChar && 
          currentStep.step.includes("Processing ciphertext") && 
          currentStep.roundNumber === index) {
        return (
          <motion.div 
            className="flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/20 p-2 rounded"
            key={`transform-${index}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-sm font-semibold mb-1">Current Transformation</div>
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded text-center">
                <div className="text-xs text-gray-500 mb-1">Ciphertext</div>
                <div className="font-mono">
                  <span className="text-xl">{currentStep.ciphertextChar}</span>
                  <div className="text-xs mt-1">Hex: {currentStep.ciphertextHex}</div>
                </div>
              </div>
              <motion.div 
                animate={{ x: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </motion.div>
              <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded text-center">
                <div className="text-xs text-gray-500 mb-1">Plaintext</div>
                <div className="font-mono">
                  <span className="text-xl">{currentStep.plaintextChar}</span>
                  <div className="text-xs mt-1">Hex: {currentStep.plaintextHex}</div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      }
    }
    
    return null;
  };

  // Show progress of text transformation
  const renderTextProgress = () => {
    if (!currentStep) return null;
    
    if (mode === 'encrypt') {
      // For encryption: show plaintext being converted to ciphertext
      if (currentStep.plaintext && currentStep.ciphertext) {
        return (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <h3 className="text-sm font-medium">Plaintext</h3>
              <h3 className="text-sm font-medium">Ciphertext</h3>
            </div>
            <div className="flex space-x-3">
              <div className="flex-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded font-mono text-sm break-all">
                {currentStep.plaintext}
              </div>
              <div className="flex-1 p-2 bg-purple-50 dark:bg-purple-900/20 rounded font-mono text-sm break-all">
                {currentStep.ciphertext}
              </div>
            </div>
          </div>
        );
      }
    } else {
      // For decryption: show ciphertext being converted to plaintext
      if (currentStep.ciphertext && currentStep.plaintext) {
        return (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <h3 className="text-sm font-medium">Ciphertext</h3>
              <h3 className="text-sm font-medium">Plaintext</h3>
            </div>
            <div className="flex space-x-3">
              <div className="flex-1 p-2 bg-purple-50 dark:bg-purple-900/20 rounded font-mono text-sm break-all">
                {currentStep.ciphertext}
              </div>
              <div className="flex-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded font-mono text-sm break-all">
                {currentStep.plaintext}
              </div>
            </div>
          </div>
        );
      }
    }
    
    return null;
  };

  return (
    <div className="flex flex-col space-y-8 w-full max-w-6xl mx-auto p-4">
      <motion.h1 
        className="text-3xl font-bold text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        ASCON Encryption Visualizer
      </motion.h1>
      
      <div className="flex justify-center space-x-4 mb-2">
        <motion.button
          className={`px-4 py-2 rounded-md transition-colors ${mode === 'encrypt' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleModeChange('encrypt')}
        >
          Encrypt
        </motion.button>
        <motion.button
          className={`px-4 py-2 rounded-md transition-colors ${mode === 'decrypt' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleModeChange('decrypt')}
        >
          Decrypt
        </motion.button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          className="space-y-4 md:col-span-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <label htmlFor="input" className="block text-sm font-medium mb-1">
              {mode === 'encrypt' ? 'Your Secret Message' : 'Ciphertext (in hex)'}
            </label>
            <textarea
              id="input"
              className="w-full p-2 border rounded-md bg-white/5 border-gray-300 dark:border-gray-700 font-mono"
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'encrypt' ? "Type something to encrypt..." : "Paste hex ciphertext to decrypt..."}
            />
          </div>
          
          {result && (
            <motion.div
              className="p-3 rounded-md bg-green-50 dark:bg-green-900/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold">
                  {mode === 'encrypt' ? 'Generated Ciphertext (hex)' : 'Decrypted Message'}
                </h3>
                <button 
                  className="text-xs text-blue-500 hover:underline"
                  onClick={handleUseResult}
                >
                  {mode === 'encrypt' ? 'Use for decryption' : 'Use for encryption'}
                </button>
              </div>
              <div className="font-mono text-sm break-all bg-white/50 dark:bg-black/20 p-2 rounded">
                {result}
              </div>
            </motion.div>
          )}
          
          <div className="flex justify-end">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
            </button>
          </div>
          
          <AnimatePresence>
            {showAdvanced && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <label htmlFor="key" className="block text-sm font-medium mb-1">
                    Encryption Key
                  </label>
                  <input
                    id="key"
                    type="text"
                    className="w-full p-2 border rounded-md bg-white/5 border-gray-300 dark:border-gray-700"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="nonce" className="block text-sm font-medium mb-1">
                    Nonce (One-time Number)
                  </label>
                  <input
                    id="nonce"
                    type="text"
                    className="w-full p-2 border rounded-md bg-white/5 border-gray-300 dark:border-gray-700"
                    value={nonce}
                    onChange={(e) => setNonce(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div>
            <label htmlFor="speed" className="block text-sm font-medium mb-1">
              Animation Speed
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs">Fast</span>
              <input
                id="speed"
                type="range"
                min="200"
                max="2000"
                step="100"
                className="flex-1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(Number(e.target.value))}
              />
              <span className="text-xs">Slow</span>
            </div>
          </div>
          
          <div className="flex space-x-3 justify-center pt-4">
            <motion.button
              onClick={handleStepBackward}
              disabled={currentStepIndex === 0 || steps.length === 0}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50 flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="19 20 9 12 19 4 19 20"></polygon>
                <line x1="5" y1="19" x2="5" y2="5"></line>
              </svg>
              Prev
            </motion.button>
            <motion.button
              onClick={handlePlayPause}
              disabled={input === ''}
              className="px-5 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Play
                </>
              )}
            </motion.button>
            <motion.button
              onClick={handleReset}
              disabled={steps.length === 0}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50 flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v6h6"></path>
                <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
                <path d="M21 22v-6h-6"></path>
                <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
              </svg>
              Reset
            </motion.button>
            <motion.button
              onClick={handleStepForward}
              disabled={currentStepIndex === steps.length - 1 || steps.length === 0}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50 flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 4 15 12 5 20 5 4"></polygon>
                <line x1="19" y1="5" x2="19" y2="19"></line>
              </svg>
            </motion.button>
          </div>
        </motion.div>
        
        <motion.div 
          className="border rounded-md p-4 bg-white/5 border-gray-300 dark:border-gray-700 md:col-span-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-bold mb-4">
            {mode === 'encrypt' ? 'Encryption Visualization' : 'Decryption Visualization'}
          </h2>
          
          {steps.length > 0 && currentStep ? (
            <div className="space-y-4">
              <div className="text-sm flex justify-between">
                <span className="font-bold">Step {currentStepIndex + 1} of {steps.length}</span>
                <span className="text-blue-500">{Math.round((currentStepIndex / (steps.length - 1)) * 100)}% complete</span>
              </div>
              
              <motion.div 
                className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/30 text-sm"
                key={currentStepIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {getSimpleDescription()}
              </motion.div>
              
              {/* Character transformation display */}
              {Array.from({ length: mode === 'encrypt' ? input.length : (input.length / 2) }).map((_, idx) => 
                renderCharTransformation(idx)
              )}
              
              {/* Text progress display */}
              {renderTextProgress()}
              
              <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">ASCON Internal State Blocks</h3>
                
                {/* Redesigned state blocks layout */}
                <div className="space-y-6">
                  {/* Current operation panel at the top */}
                  <div className="bg-white/80 dark:bg-black/20 p-3 rounded-md">
                    <h4 className="font-medium text-sm mb-2">Current Operation</h4>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {currentStep.step} {currentStep.substep ? `- ${currentStep.substep}` : ""}
                    </div>
                    
                    {currentStep.step.includes("Processing") && (
                      <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-md">
                        <div className="text-xs font-medium mb-1">What's happening:</div>
                        <div className="text-xs">
                          {mode === 'encrypt' 
                            ? "The plaintext is being XORed with the first state block to create ciphertext" 
                            : "The ciphertext is being XORed with the first state block to recover plaintext"}
                        </div>
                      </div>
                    )}
                    
                    {currentStep.substep === "Addition of round constant" && (
                      <div className="mt-2 bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                        <div className="text-xs font-medium mb-1">What's happening:</div>
                        <div className="text-xs">
                          Constant value 0x{ROUND_CONSTANTS[currentStep.roundNumber || 0].toString(16)} is being XORed with state block 3 to add randomness
                        </div>
                      </div>
                    )}
                    
                    {currentStep.substep === "Substitution layer" && (
                      <div className="mt-2 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-md">
                        <div className="text-xs font-medium mb-1">What's happening:</div>
                        <div className="text-xs">
                          Each bit in all state blocks is being flipped (0→1, 1→0) to add confusion
                        </div>
                      </div>
                    )}
                    
                    {currentStep.substep === "Linear diffusion layer" && (
                      <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                        <div className="text-xs font-medium mb-1">What's happening:</div>
                        <div className="text-xs">
                          Bits in each state block are being rotated to mix and spread changes throughout the state
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Row of state blocks with adequate spacing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
                    {currentStep.state.map((word, index) => {
                      // Convert word to binary representation for visualization
                      const bits = word.toString(2).padStart(64, '0');
                      // Count 1s for intensity
                      const intensity = (bits.match(/1/g) || []).length / 64;
                      
                      // Determine the role of each block
                      let blockRole = "";
                      let roleDescription = "";
                      if (index === 0) {
                        blockRole = "Rate Block";
                        roleDescription = "Interacts with plaintext/ciphertext";
                      } else if (index === 1 || index === 2) {
                        blockRole = "Key Block";
                        roleDescription = "Contains key material";
                      } else if (index === 3 || index === 4) {
                        blockRole = "Capacity Block";
                        roleDescription = "Preserves internal state security";
                      }
                      
                      const displayBits = bits.substring(0, 16) + "..." + bits.substring(bits.length - 16);
                      const stateHex = formatStateWord(word);
                      
                      return (
                        <motion.div 
                          key={`state-block-${index}`}
                          className="border rounded-md overflow-hidden bg-white dark:bg-gray-800"
                          initial={{ opacity: 0.9 }}
                          animate={{ 
                            opacity: 1,
                            transition: { duration: 0.3 }
                          }}
                          layout
                        >
                          <div className="bg-blue-500 text-white p-2 text-center text-sm font-semibold">
                            State Block {index + 1}: {blockRole}
                          </div>
                          <div className="p-3">
                            <div className="text-xs text-gray-500 mb-2">
                              {roleDescription}
                            </div>
                            
                            <div className="font-mono text-xs mb-3 overflow-hidden">
                              <span className="font-medium">Hex:</span> {stateHex}
                            </div>
                            
                            <div className="mt-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Bit distribution:</span>
                                <span className="font-medium">{Math.round(intensity * 100)}% ones</span>
                              </div>
                              <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
                                <motion.div 
                                  className="h-full bg-blue-500" 
                                  style={{ width: `${Math.round(intensity * 100)}%` }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.round(intensity * 100)}%` }}
                                  transition={{ duration: 0.3 }}
                                />
                              </div>
                            </div>
                            
                            <div className="mt-3 text-xs font-mono">
                              <div className="flex flex-col">
                                <span className="font-medium">Bits sample:</span>
                                <div className="bg-gray-50 dark:bg-gray-900 p-1 mt-1 rounded overflow-x-auto whitespace-nowrap">
                                  {displayBits}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Animated visualization of operations */}
                {isPlaying && currentStep.substep && (
                  <div className="absolute inset-0 pointer-events-none">
                    {currentStep.substep === "Addition of round constant" && (
                      <motion.div 
                        className="absolute right-10 top-1/2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        initial={{ x: 100, y: 0, opacity: 0 }}
                        animate={{ x: 0, y: 0, opacity: 1 }}
                        transition={{ 
                          duration: 1,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      >
                        XOR
                      </motion.div>
                    )}
                    
                    {currentStep.substep === "Substitution layer" && (
                      Array.from({ length: 10 }).map((_, idx) => (
                        <motion.div
                          key={`flip-${idx}`}
                          className="absolute w-6 h-6 flex items-center justify-center"
                          initial={{ 
                            x: Math.random() * 300, 
                            y: Math.random() * 200,
                            opacity: 0
                          }}
                          animate={{ 
                            opacity: [0, 1, 0],
                            scale: [0.5, 1.5, 0.5],
                            rotateY: [0, 180]
                          }}
                          transition={{ 
                            duration: 1 + Math.random(),
                            repeat: Infinity,
                            delay: Math.random() * 0.5
                          }}
                        >
                          <div className="text-xs font-mono">
                            {Math.random() > 0.5 ? "1→0" : "0→1"}
                          </div>
                        </motion.div>
                      ))
                    )}
                    
                    {currentStep.substep === "Linear diffusion layer" && (
                      Array.from({ length: 10 }).map((_, idx) => (
                        <motion.div
                          key={`rotate-${idx}`}
                          className="absolute w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center"
                          initial={{ 
                            x: Math.random() * 300, 
                            y: Math.random() * 200,
                            opacity: 0
                          }}
                          animate={{ 
                            opacity: [0, 1, 0],
                            rotate: [0, 360]
                          }}
                          transition={{ 
                            duration: 1.5,
                            repeat: Infinity,
                            delay: Math.random() * 0.5
                          }}
                        >
                          <div className="text-xs font-mono">↻</div>
                        </motion.div>
                      ))
                    )}
                    
                    {currentStep.step.includes("Processing") && (
                      <motion.div
                        className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-yellow-500/70 text-white rounded-lg text-sm"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        XOR Operation
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
              
              {showAdvanced && (
                <motion.div 
                  className="space-y-2 mt-2"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <h3 className="font-medium text-sm">Technical Details:</h3>
                  <div className="font-mono text-xs bg-black/10 dark:bg-white/10 p-2 rounded overflow-x-auto">
                    {currentStep.state.map((word, index) => (
                      <div key={index} className="flex justify-between mb-1">
                        <span>x{index}:</span>
                        <span>{formatStateWord(word)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs mt-1">
                    <span className="font-bold">Operation:</span> {currentStep.step}
                    {currentStep.roundNumber !== undefined && ` (Round ${currentStep.roundNumber + 1})`}
                    {currentStep.substep && ` - ${currentStep.substep}`}
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <motion.svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="40" 
                height="40" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-gray-400 mb-3"
                animate={{ rotate: [0, 10, 0, -10, 0] }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </motion.svg>
              <p className="text-gray-500 text-center">
                {input ? 'Click "Play" to start visualization' : 
                  mode === 'encrypt' ? 'Enter your message to encrypt' : 'Enter ciphertext (hex) to decrypt'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
      
      <motion.div 
        className="border rounded-md p-4 bg-white/5 border-gray-300 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-xl font-bold mb-2">How ASCON {mode === 'encrypt' ? 'Encryption' : 'Decryption'} Works</h2>
        
        <div className="mb-4">
          <h3 className="text-md font-semibold mb-2">Understanding State Blocks</h3>
          <p className="text-sm mb-2">
            ASCON encryption uses a 320-bit <strong>state</strong> divided into 5 blocks of 64 bits each. These state blocks serve different purposes:
          </p>
          <ul className="list-disc list-inside text-sm mb-3 space-y-1">
            <li><strong>Rate Block (Block 1)</strong>: Directly interacts with the plaintext or ciphertext during encryption/decryption.</li>
            <li><strong>Key Blocks (Blocks 2-3)</strong>: Hold parts of the encryption key, which ensures only someone with the key can decrypt.</li>
            <li><strong>Capacity Blocks (Blocks 4-5)</strong>: Maintain the internal security of the algorithm, never directly exposed to input/output.</li>
          </ul>
          
          <h3 className="text-md font-semibold mb-2">Core Operations</h3>
          <p className="text-sm mb-2">
            During encryption, ASCON performs three main operations on these state blocks:
          </p>
          <ul className="list-disc list-inside text-sm mb-3 space-y-1">
            <li><strong>Addition of Round Constants</strong>: Adds specific values to block 3 in each round to prevent symmetry attacks.</li>
            <li><strong>Substitution Layer</strong>: Flips bits (0→1, 1→0) in groups across all blocks, creating cryptographic confusion.</li>
            <li><strong>Linear Diffusion</strong>: Rotates and mixes bits within each block, ensuring changes spread throughout the entire state (diffusion).</li>
          </ul>
          
          <h3 className="text-md font-semibold mb-2">Why These Operations?</h3>
          <p className="text-sm">
            These operations work together to create a secure encryption system:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li><strong>Confusion</strong>: The substitution layer makes it impossible to predict how one bit change affects others.</li>
            <li><strong>Diffusion</strong>: The linear diffusion layer ensures that changing one bit of the plaintext affects many bits of the ciphertext.</li>
            <li><strong>Unique Rounds</strong>: The round constants make each round different, preventing certain mathematical attacks.</li>
            <li><strong>Security Isolation</strong>: The capacity blocks never directly interact with plaintext/ciphertext, preserving internal security.</li>
          </ul>
        </div>
        
        <div className="text-sm">
          {mode === 'encrypt' ? (
            <>
              <p className="mb-2">
                ASCON takes your plain text message and transforms it into encrypted ciphertext through these steps:
              </p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>The algorithm starts with an empty state (5 blocks)</li>
                <li>Your secret key and a unique number (nonce) are mixed into the state</li>
                <li>Multiple rounds of mixing operations are performed to increase security</li>
                <li>Each character of your message is processed one by one, combining with the state</li>
                <li>The state value creates the encrypted ciphertext for each character</li>
                <li>Final mixing rounds are performed to generate an authentication tag</li>
              </ol>
            </>
          ) : (
            <>
              <p className="mb-2">
                ASCON decryption reverses the encryption process to recover your original message:
              </p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>The algorithm starts with the same empty state as encryption</li>
                <li>The same secret key and nonce are mixed into the state</li>
                <li>The same initial mixing operations are performed</li>
                <li>The ciphertext is processed to recover the original plaintext</li>
                <li>Finally, the authentication tag is verified to ensure the message wasn't tampered with</li>
              </ol>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
} 