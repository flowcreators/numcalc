"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [calculations, setCalculations] = useState<string[]>([]);
  const [calculatePerWord, setCalculatePerWord] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const [useRecursiveReduction, setUseRecursiveReduction] = useState(true);

  const reduceToSingleDigit = (num: number): number => {
    // Check for master numbers first
    if (num === 11 || num === 22 || num === 33) return num;
    if (num < 10) return num;
    const reduced = String(num).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    // Check if the reduced number is a master number
    if (reduced === 11 || reduced === 22 || reduced === 33) return reduced;
    return reduced > 9 ? reduceToSingleDigit(reduced) : reduced;
  };

  const calculatePythagoreanNumber = (text: string) => {
    const letterValues: { [key: string]: number } = {};
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((letter, index) => {
      letterValues[letter] = (index % 9) + 1;
    });

    const newCalculations: string[] = [];
    let finalResult: number;

    if (calculatePerWord) {
      const words = text.split(/\s+/).filter(word => word.length > 0);
      const wordResults = words.map(word => {
        const wordSum = word
          .toUpperCase()
          .split('')
          .filter(char => /[A-Z]/.test(char))
          .reduce((acc, char) => {
            const value = letterValues[char] || 0;
            if (showDetails) {
              newCalculations.push(`${char} = ${value}`);
            }
            return acc + value;
          }, 0);
        
        if (showDetails) {
          newCalculations.push(`${word} = ${wordSum}`);
          if (useRecursiveReduction && wordSum > 9) {
            newCalculations.push(`Reduced: ${wordSum} → ${reduceToSingleDigit(wordSum)}`);
          }
        }
        return useRecursiveReduction ? reduceToSingleDigit(wordSum) : wordSum;
      });

      finalResult = useRecursiveReduction 
        ? reduceToSingleDigit(wordResults.reduce((acc, num) => acc + num, 0))
        : wordResults.reduce((acc, num) => acc + num, 0);
    } else {
      const sum = text
        .toUpperCase()
        .split('')
        .filter(char => /[A-Z]/.test(char))
        .reduce((acc, char) => {
          const value = letterValues[char] || 0;
          if (showDetails) {
            newCalculations.push(`${char} = ${value}`);
          }
          return acc + value;
        }, 0);

      finalResult = useRecursiveReduction ? reduceToSingleDigit(sum) : sum;
      
      if (showDetails && useRecursiveReduction && sum > 9) {
        newCalculations.push(`Total: ${sum}`);
        newCalculations.push(`Reduced: ${sum} → ${finalResult}`);
      }
    }

    setCalculations(newCalculations);
    setResult(finalResult);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-purple-600 dark:text-purple-400">
          Pythagorean Numerology Calculator
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-xl mx-auto">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Word, Name, or Words/Names List
              </label>
              <input
                type="text"
                id="name"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                placeholder="Type a name or word..."
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Calculation</span>
                <div className="flex items-center space-x-2">
                  <label className={`px-3 py-1 rounded-lg cursor-pointer ${!calculatePerWord ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    <input
                      type="radio"
                      className="hidden"
                      checked={!calculatePerWord}
                      onChange={() => setCalculatePerWord(false)}
                    />
                    For All Letters
                  </label>
                  <label className={`px-3 py-1 rounded-lg cursor-pointer ${calculatePerWord ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    <input
                      type="radio"
                      className="hidden"
                      checked={calculatePerWord}
                      onChange={() => setCalculatePerWord(true)}
                    />
                    For Each Word
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Display</span>
                <div className="flex items-center space-x-2">
                  <label className={`px-3 py-1 rounded-lg cursor-pointer ${!showDetails ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    <input
                      type="radio"
                      className="hidden"
                      checked={!showDetails}
                      onChange={() => setShowDetails(false)}
                    />
                    Result Only
                  </label>
                  <label className={`px-3 py-1 rounded-lg cursor-pointer ${showDetails ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    <input
                      type="radio"
                      className="hidden"
                      checked={showDetails}
                      onChange={() => setShowDetails(true)}
                    />
                    Calculation Details
                  </label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recursive"
                  checked={useRecursiveReduction}
                  onChange={(e) => setUseRecursiveReduction(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <label htmlFor="recursive" className="text-sm font-medium">
                  Use recursive reduction to get only one digit
                </label>
              </div>
            </div>

            <button
              onClick={() => calculatePythagoreanNumber(input)}
              className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Calculate
            </button>

            {result !== null && (
              <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {showDetails && calculations.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-left order-1 md:order-none">
                      <h3 className="font-medium mb-2 text-sm">Calculation Details</h3>
                      {calculations.map((calc, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
                          {calc}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Your Number</h2>
                    <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                      {result}
                    </div>

                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      <h3 className="font-medium mb-2">Number Meaning</h3>
                  <p className="italic">
                    {result === 1 && "Unity and beginnings - representing leadership and independence"}
                    {result === 2 && "Harmony and balance - symbolizing cooperation and diplomacy"}
                    {result === 3 && "Creativity and expression - bringing joy and artistic abilities"}
                    {result === 4 && "Stability and foundation - signifying hard work and reliability"}
                    {result === 5 && "Freedom and adventure - representing change and versatility"}
                    {result === 6 && "Love and harmony - symbolizing responsibility and care"}
                    {result === 7 && "Wisdom and spirituality - representing analysis and understanding"}
                    {result === 8 && "Power and abundance - symbolizing material success"}
                    {result === 9 && "Completion and humanitarianism - representing compassion"}
                    {result === 11 && "Master number - Intuition and spiritual insight"}
                    {result === 22 && "Master number - Master builder and manifestation"}
                    {result === 33 && "Master number - Master teacher and spiritual guidance"}
                  </p>
                </div>
              </div>
            </div>
          </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4 text-center text-purple-600 dark:text-purple-400">About Pythagorean Numerology</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-sm text-gray-600 dark:text-gray-300">
            <p className="mb-4">
              Pythagorean numerology is a system that assigns numerical values to letters in the alphabet (A=1, B=2, ..., I=9, J=1, etc.).
              This ancient practice converts names or words into numbers by adding these values together, potentially reducing them to a single digit through recursive addition.
            </p>
            <p>
              Each resulting number (1-9) is believed to carry unique vibrations and meanings, offering insights into personality traits, life paths, and potential opportunities.
              While it&apos;s important to note this is for entertainment purposes, it can be a fascinating tool for self-reflection and personal exploration.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Note: This calculator is for entertainment purposes only.</p>
        </div>
      </main>
    </div>
  );
}
