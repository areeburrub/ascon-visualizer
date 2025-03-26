// ASCON Encryption Algorithm Implementation for Visualization
// Based on ASCON-128 variant

// Constants
const ROUNDS_A = 12; // Rounds in initialization and finalization
const ROUNDS_B = 6;  // Rounds in processing associated data and plaintext

// State size is 320 bits (5 64-bit words)
type AsconState = [number, number, number, number, number];

// Permutation constants for each round
export const ROUND_CONSTANTS = [
  0xf0, 0xe1, 0xd2, 0xc3, 0xb4, 0xa5, 0x96, 0x87,
  0x78, 0x69, 0x5a, 0x4b
];

// For visualization tracking
export interface StateStep {
  state: AsconState;
  step: string;
  roundNumber?: number;
  substep?: string;
  plaintextChar?: string;
  ciphertextChar?: string;
  plaintextHex?: string;
  ciphertextHex?: string;
  ciphertext?: string;
  plaintext?: string;
}

// Helper function to convert text to bytes
export function textToBytes(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

// Helper function to convert bytes to text
export function bytesToText(bytes: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

// Helper function to convert bytes to hex for display
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

// Helper function to convert hex to bytes
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i/2] = parseInt(hex.substring(i, i+2), 16);
  }
  return bytes;
}

// Simplified ASCON encryption (for visualization)
export function encryptAsconForVisualization(
  plaintext: string, 
  key: string = 'ASCON visualization key',
  nonce: string = 'ASCON nonce'
): StateStep[] {
  // Convert inputs to bytes
  const plaintextBytes = textToBytes(plaintext);
  const keyBytes = textToBytes(key.slice(0, 16)); // Only use first 16 bytes for 128-bit key
  const nonceBytes = textToBytes(nonce.slice(0, 16)); // 16 bytes for nonce
  
  // Initialize state steps for visualization
  const stateSteps: StateStep[] = [];
  
  // Initial state (simplified)
  const state: AsconState = [0, 0, 0, 0, 0];
  
  // To store generated ciphertext
  const ciphertext: number[] = [];
  
  // Record initial state
  stateSteps.push({
    state: [...state],
    step: "Initial state",
    plaintext: plaintext,
    plaintextHex: bytesToHex(plaintextBytes)
  });
  
  // Initialization phase
  // In real ASCON, we would initialize with key, nonce, and constants
  state[0] = 0x80400c0600000000; // IV for ASCON-128
  
  // Add key to state (simplified)
  state[1] ^= keyBytes.length > 0 ? keyBytes[0] : 0;
  state[2] ^= keyBytes.length > 1 ? keyBytes[1] : 0;
  
  // Add nonce to state (simplified)
  state[3] ^= nonceBytes.length > 0 ? nonceBytes[0] : 0;
  state[4] ^= nonceBytes.length > 1 ? nonceBytes[1] : 0;
  
  stateSteps.push({
    state: [...state],
    step: "After initialization with IV, key, and nonce",
    plaintext: plaintext,
    plaintextHex: bytesToHex(plaintextBytes)
  });
  
  // Initial permutation
  for (let round = 0; round < ROUNDS_A; round++) {
    // Addition of round constants (simplified)
    state[2] ^= ROUND_CONSTANTS[round % ROUND_CONSTANTS.length];
    
    stateSteps.push({
      state: [...state],
      step: "Permutation",
      roundNumber: round,
      substep: "Addition of round constant",
      plaintext: plaintext,
      plaintextHex: bytesToHex(plaintextBytes)
    });
    
    // Substitution layer (simplified)
    // In real ASCON, this is a 5-bit S-box applied to each 5-bit chunk
    state[0] = ~state[0];
    state[1] = ~state[1];
    state[2] = ~state[2];
    state[3] = ~state[3];
    state[4] = ~state[4];
    
    stateSteps.push({
      state: [...state],
      step: "Permutation",
      roundNumber: round,
      substep: "Substitution layer",
      plaintext: plaintext,
      plaintextHex: bytesToHex(plaintextBytes)
    });
    
    // Linear diffusion layer (simplified)
    // In real ASCON, each word undergoes specific rotations and XORs
    state[0] = (state[0] << 1) | (state[0] >>> 63);
    state[1] = (state[1] << 5) | (state[1] >>> 59);
    state[2] = (state[2] << 10) | (state[2] >>> 54);
    state[3] = (state[3] << 15) | (state[3] >>> 49);
    state[4] = (state[4] << 20) | (state[4] >>> 44);
    
    stateSteps.push({
      state: [...state],
      step: "Permutation",
      roundNumber: round,
      substep: "Linear diffusion layer",
      plaintext: plaintext,
      plaintextHex: bytesToHex(plaintextBytes)
    });
  }
  
  // Process plaintext blocks (simplified)
  for (let i = 0; i < plaintextBytes.length; i++) {
    const plaintextChar = String.fromCharCode(plaintextBytes[i]);
    const plaintextHex = plaintextBytes[i].toString(16).padStart(2, '0');
    
    // XOR plaintext block with state
    state[0] ^= plaintextBytes[i];
    
    // Calculate ciphertext byte
    const ciphertextByte = state[0] & 0xFF;
    ciphertext.push(ciphertextByte);
    
    // Convert current byte to character and hex for visualization
    const ciphertextChar = String.fromCharCode(ciphertextByte);
    const ciphertextHex = ciphertextByte.toString(16).padStart(2, '0');
    
    // Calculate current ciphertext string
    const currentCiphertext = new Uint8Array(ciphertext);
    
    stateSteps.push({
      state: [...state],
      step: "Processing plaintext",
      roundNumber: i,
      substep: "XOR with plaintext block",
      plaintextChar,
      plaintextHex,
      ciphertextChar,
      ciphertextHex,
      plaintext: plaintext.substring(0, i+1),
      ciphertext: bytesToHex(currentCiphertext)
    });
    
    // Permutation between blocks (simplified)
    if (i < plaintextBytes.length - 1) {
      for (let round = 0; round < ROUNDS_B; round++) {
        // Simplified permutation (same as above but fewer rounds)
        state[2] ^= ROUND_CONSTANTS[round % ROUND_CONSTANTS.length];
        
        stateSteps.push({
          state: [...state],
          step: "Permutation between blocks",
          roundNumber: round,
          substep: "Addition of round constant",
          plaintext: plaintext.substring(0, i+1),
          ciphertext: bytesToHex(new Uint8Array(ciphertext))
        });
        
        state[0] = ~state[0];
        state[1] = ~state[1];
        state[2] = ~state[2];
        state[3] = ~state[3];
        state[4] = ~state[4];
        
        stateSteps.push({
          state: [...state],
          step: "Permutation between blocks",
          roundNumber: round,
          substep: "Substitution layer",
          plaintext: plaintext.substring(0, i+1),
          ciphertext: bytesToHex(new Uint8Array(ciphertext))
        });
        
        state[0] = (state[0] << 1) | (state[0] >>> 63);
        state[1] = (state[1] << 5) | (state[1] >>> 59);
        state[2] = (state[2] << 10) | (state[2] >>> 54);
        state[3] = (state[3] << 15) | (state[3] >>> 49);
        state[4] = (state[4] << 20) | (state[4] >>> 44);
        
        stateSteps.push({
          state: [...state],
          step: "Permutation between blocks",
          roundNumber: round,
          substep: "Linear diffusion layer",
          plaintext: plaintext.substring(0, i+1),
          ciphertext: bytesToHex(new Uint8Array(ciphertext))
        });
      }
    }
  }
  
  // Finalization phase
  // XOR key with state (simplified)
  state[3] ^= keyBytes.length > 0 ? keyBytes[0] : 0;
  state[4] ^= keyBytes.length > 1 ? keyBytes[1] : 0;
  
  stateSteps.push({
    state: [...state],
    step: "Finalization - XOR with key",
    plaintext: plaintext,
    ciphertext: bytesToHex(new Uint8Array(ciphertext))
  });
  
  // Final permutation
  for (let round = 0; round < ROUNDS_A; round++) {
    // Same permutation as in initialization
    state[2] ^= ROUND_CONSTANTS[round % ROUND_CONSTANTS.length];
    
    stateSteps.push({
      state: [...state],
      step: "Final permutation",
      roundNumber: round,
      substep: "Addition of round constant",
      plaintext: plaintext,
      ciphertext: bytesToHex(new Uint8Array(ciphertext))
    });
    
    state[0] = ~state[0];
    state[1] = ~state[1];
    state[2] = ~state[2];
    state[3] = ~state[3];
    state[4] = ~state[4];
    
    stateSteps.push({
      state: [...state],
      step: "Final permutation",
      roundNumber: round,
      substep: "Substitution layer",
      plaintext: plaintext,
      ciphertext: bytesToHex(new Uint8Array(ciphertext))
    });
    
    state[0] = (state[0] << 1) | (state[0] >>> 63);
    state[1] = (state[1] << 5) | (state[1] >>> 59);
    state[2] = (state[2] << 10) | (state[2] >>> 54);
    state[3] = (state[3] << 15) | (state[3] >>> 49);
    state[4] = (state[4] << 20) | (state[4] >>> 44);
    
    stateSteps.push({
      state: [...state],
      step: "Final permutation",
      roundNumber: round,
      substep: "Linear diffusion layer",
      plaintext: plaintext,
      ciphertext: bytesToHex(new Uint8Array(ciphertext))
    });
  }
  
  // XOR key with state to get tag (simplified)
  state[3] ^= keyBytes.length > 0 ? keyBytes[0] : 0;
  state[4] ^= keyBytes.length > 1 ? keyBytes[1] : 0;
  
  // Create authentication tag from state
  const tag = [state[3] & 0xFF, state[4] & 0xFF];
  
  // Add tag to ciphertext (simplified)
  ciphertext.push(...tag);
  
  stateSteps.push({
    state: [...state],
    step: "Final state - Authentication tag generated",
    plaintext: plaintext,
    ciphertext: bytesToHex(new Uint8Array(ciphertext))
  });
  
  return stateSteps;
}

// Simplified ASCON decryption (for visualization)
export function decryptAsconForVisualization(
  ciphertextHex: string,
  key: string = 'ASCON visualization key',
  nonce: string = 'ASCON nonce'
): StateStep[] {
  // Convert inputs to bytes
  const ciphertextBytes = hexToBytes(ciphertextHex);
  const keyBytes = textToBytes(key.slice(0, 16)); // Only use first 16 bytes for 128-bit key
  const nonceBytes = textToBytes(nonce.slice(0, 16)); // 16 bytes for nonce
  
  // For simplification, we'll assume the last 2 bytes are the tag
  const ciphertextWithoutTag = ciphertextBytes.slice(0, ciphertextBytes.length - 2);
  const tag = ciphertextBytes.slice(ciphertextBytes.length - 2);
  
  // Initialize state steps for visualization
  const stateSteps: StateStep[] = [];
  
  // Initial state (simplified)
  const state: AsconState = [0, 0, 0, 0, 0];
  
  // To store recovered plaintext
  const plaintext: number[] = [];
  
  // Record initial state
  stateSteps.push({
    state: [...state],
    step: "Initial state (decryption)",
    ciphertext: ciphertextHex
  });
  
  // Initialization phase (same as encryption)
  state[0] = 0x80400c0600000000; // IV for ASCON-128
  
  // Add key to state
  state[1] ^= keyBytes.length > 0 ? keyBytes[0] : 0;
  state[2] ^= keyBytes.length > 1 ? keyBytes[1] : 0;
  
  // Add nonce to state
  state[3] ^= nonceBytes.length > 0 ? nonceBytes[0] : 0;
  state[4] ^= nonceBytes.length > 1 ? nonceBytes[1] : 0;
  
  stateSteps.push({
    state: [...state],
    step: "After initialization with IV, key, and nonce (decryption)",
    ciphertext: ciphertextHex
  });
  
  // Initial permutation (same as encryption)
  for (let round = 0; round < ROUNDS_A; round++) {
    state[2] ^= ROUND_CONSTANTS[round % ROUND_CONSTANTS.length];
    
    stateSteps.push({
      state: [...state],
      step: "Permutation (decryption)",
      roundNumber: round,
      substep: "Addition of round constant",
      ciphertext: ciphertextHex
    });
    
    state[0] = ~state[0];
    state[1] = ~state[1];
    state[2] = ~state[2];
    state[3] = ~state[3];
    state[4] = ~state[4];
    
    stateSteps.push({
      state: [...state],
      step: "Permutation (decryption)",
      roundNumber: round,
      substep: "Substitution layer",
      ciphertext: ciphertextHex
    });
    
    state[0] = (state[0] << 1) | (state[0] >>> 63);
    state[1] = (state[1] << 5) | (state[1] >>> 59);
    state[2] = (state[2] << 10) | (state[2] >>> 54);
    state[3] = (state[3] << 15) | (state[3] >>> 49);
    state[4] = (state[4] << 20) | (state[4] >>> 44);
    
    stateSteps.push({
      state: [...state],
      step: "Permutation (decryption)",
      roundNumber: round,
      substep: "Linear diffusion layer",
      ciphertext: ciphertextHex
    });
  }
  
  // Process ciphertext blocks
  for (let i = 0; i < ciphertextWithoutTag.length; i++) {
    const ciphertextByte = ciphertextWithoutTag[i];
    const ciphertextChar = String.fromCharCode(ciphertextByte);
    const ciphertextHexChar = ciphertextByte.toString(16).padStart(2, '0');
    
    // Extract ciphertext block (will be the same as state top bits after XOR with plaintext in encryption)
    // Recover plaintext byte
    const plaintextByte = state[0] ^ ciphertextByte;
    plaintext.push(plaintextByte);
    
    // Update state with ciphertext byte
    state[0] = (state[0] & ~0xFF) | ciphertextByte;
    
    // Convert current byte to character and hex for visualization
    const plaintextChar = String.fromCharCode(plaintextByte);
    const plaintextHex = plaintextByte.toString(16).padStart(2, '0');
    
    // Calculate current plaintext string
    const currentPlaintext = new Uint8Array(plaintext);
    
    stateSteps.push({
      state: [...state],
      step: "Processing ciphertext (decryption)",
      roundNumber: i,
      substep: "XOR with state to recover plaintext",
      plaintextChar,
      plaintextHex,
      ciphertextChar,
      ciphertextHex: ciphertextHexChar,
      plaintext: bytesToHex(currentPlaintext),
      ciphertext: ciphertextHex.substring(0, 2*(i+1))
    });
    
    // Permutation between blocks (only if not the last block)
    if (i < ciphertextWithoutTag.length - 1) {
      for (let round = 0; round < ROUNDS_B; round++) {
        state[2] ^= ROUND_CONSTANTS[round % ROUND_CONSTANTS.length];
        
        stateSteps.push({
          state: [...state],
          step: "Permutation between blocks (decryption)",
          roundNumber: round,
          substep: "Addition of round constant",
          plaintext: bytesToHex(new Uint8Array(plaintext)),
          ciphertext: ciphertextHex.substring(0, 2*(i+1))
        });
        
        state[0] = ~state[0];
        state[1] = ~state[1];
        state[2] = ~state[2];
        state[3] = ~state[3];
        state[4] = ~state[4];
        
        stateSteps.push({
          state: [...state],
          step: "Permutation between blocks (decryption)",
          roundNumber: round,
          substep: "Substitution layer",
          plaintext: bytesToHex(new Uint8Array(plaintext)),
          ciphertext: ciphertextHex.substring(0, 2*(i+1))
        });
        
        state[0] = (state[0] << 1) | (state[0] >>> 63);
        state[1] = (state[1] << 5) | (state[1] >>> 59);
        state[2] = (state[2] << 10) | (state[2] >>> 54);
        state[3] = (state[3] << 15) | (state[3] >>> 49);
        state[4] = (state[4] << 20) | (state[4] >>> 44);
        
        stateSteps.push({
          state: [...state],
          step: "Permutation between blocks (decryption)",
          roundNumber: round,
          substep: "Linear diffusion layer",
          plaintext: bytesToHex(new Uint8Array(plaintext)),
          ciphertext: ciphertextHex.substring(0, 2*(i+1))
        });
      }
    }
  }
  
  // Verify tag (simplified)
  state[3] ^= keyBytes.length > 0 ? keyBytes[0] : 0;
  state[4] ^= keyBytes.length > 1 ? keyBytes[1] : 0;
  
  stateSteps.push({
    state: [...state],
    step: "Finalization - XOR with key (decryption)",
    plaintext: bytesToHex(new Uint8Array(plaintext)),
    ciphertext: ciphertextHex
  });
  
  // Final steps to verify the tag
  const computedTag = [state[3] & 0xFF, state[4] & 0xFF];
  const tagValid = computedTag[0] === tag[0] && computedTag[1] === tag[1];
  
  stateSteps.push({
    state: [...state],
    step: `Final state - Authentication tag ${tagValid ? 'valid' : 'invalid'} (decryption)`,
    plaintext: bytesToText(new Uint8Array(plaintext)),
    ciphertext: ciphertextHex
  });
  
  return stateSteps;
} 