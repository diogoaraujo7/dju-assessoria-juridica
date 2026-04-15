
import React from 'react';
import { MultipleChoiceStepData, Language } from '../../types';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface MultipleChoiceContentProps {
  data: MultipleChoiceStepData;
  onSelect: (option: string) => void;
  language: Language;
}

export const MultipleChoiceContent: React.FC<MultipleChoiceContentProps> = ({ data, onSelect }) => {
  const hasSelected = !!data.input;

  return (
    <div>
      {data.content && (
        <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 mb-6">
          <div className="prose prose-slate max-w-none prose-p:my-2 prose-ul:my-2 prose-a:text-blue-600 hover:prose-a:underline">
            <MarkdownRenderer>{data.content.replace(/\\n/g, '\n')}</MarkdownRenderer>
          </div>
        </div>
      )}
      
      {data.systemHint && (
        <div className="my-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm flex items-center gap-3 animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <span>{data.systemHint}</span>
        </div>
      )}

      {data.options && data.options.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">Selecione uma opção:</p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            {data.options.map((option, i) => {
              const isSelected = data.input?.text === option;
              return (
                <button
                  key={i}
                  onClick={() => onSelect(option)}
                  disabled={hasSelected}
                  className={`
                    p-4 border rounded-lg text-left transition-colors
                    ${isSelected 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white hover:bg-blue-50 border-slate-300 text-slate-700'
                    }
                    ${hasSelected && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="font-medium">{option}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
};
