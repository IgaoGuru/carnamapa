import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { BlockFeature } from '../lib/types';

interface MeusBlocosModalProps {
  blocks: BlockFeature[];
  onClose: () => void;
  onSelectBlock: (block: BlockFeature) => void;
}

// Decode HTML entities in block names
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export function MeusBlocosModal({ blocks, onClose, onSelectBlock }: MeusBlocosModalProps) {
  // Sort blocks by date (ascending), then by time (ascending)
  const sortedBlocks = useMemo(() => {
    return [...blocks].sort((a, b) => {
      // First sort by date
      const dateCompare = a.properties.date.localeCompare(b.properties.date);
      if (dateCompare !== 0) return dateCompare;
      // Then sort by time
      return a.properties.time.localeCompare(b.properties.time);
    });
  }, [blocks]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full sm:w-96 sm:rounded-xl rounded-t-xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white p-4 flex justify-between items-start border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Meus Blocos</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {sortedBlocks.length === 0 ? (
            /* Empty state */
            <div className="py-8 text-center">
              <p className="text-gray-600">
                Você ainda não confirmou presença em nenhum bloco
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Clique em "Eu vou!" nos blocos para adicioná-los aqui
              </p>
            </div>
          ) : (
            /* Block list */
            <div className="space-y-3">
              {sortedBlocks.map((block) => {
                const { properties: p } = block;
                const dateFormatted = format(parseISO(p.date), "EEE, d 'de' MMM", { locale: ptBR });
                const blockName = decodeHtmlEntities(p.name);

                return (
                  <button
                    key={block.id}
                    className="w-full p-3 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => onSelectBlock(block)}
                  >
                    <p className="font-medium text-gray-900">{blockName}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <span className="capitalize">{dateFormatted}</span>
                      <span>•</span>
                      <span>{p.time}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
