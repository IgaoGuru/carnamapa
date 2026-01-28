import type { BlockFeature } from '../lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRsvp } from '../hooks/useRsvp';

interface BlockDetailModalProps {
  block: BlockFeature;
  onClose: () => void;
}

// Decode HTML entities in block names
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export function BlockDetailModal({ block, onClose }: BlockDetailModalProps) {
  const { properties: p } = block;
  const dateFormatted = format(parseISO(p.date), "EEEE, d 'de' MMMM", { locale: ptBR });
  const blockName = decodeHtmlEntities(p.name);
  const { isGoing, isLoading, toggleRsvp, canRsvp } = useRsvp(block.id, p.date);

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
        <div className="sticky top-0 bg-white p-4 flex justify-between items-start">
          <h2 className="text-xl font-bold text-gray-900 pr-8">{blockName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-gray-700">
            <span className="font-bold capitalize">{dateFormatted}</span>
            <span className="text-carnival-black font-semibold">{p.time}</span>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 text-gray-700">
            <div>
              <p className="font-medium">{p.neighborhood}</p>
              {p.address && <p className="text-sm text-gray-500">{p.address}</p>}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            {p.is_free ? (
              <span className="text-green-600 font-medium">Gratuito</span>
            ) : (
              <span className="text-gray-700">{p.price_formatted || `R$ ${p.price}`}</span>
            )}
          </div>

          {/* Description */}
          {p.description && (
            <p className="text-gray-600 text-sm">{p.description}</p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4">
            <button
              onClick={toggleRsvp}
              disabled={isLoading || !canRsvp}
              className={`w-full py-3 font-medium rounded-lg transition-colors ${
                isLoading || !canRsvp
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              } ${
                isGoing
                  ? 'border-2 border-carnival-blue text-carnival-blue bg-transparent hover:bg-carnival-blue/10'
                  : 'bg-carnival-green text-white hover:bg-blue-600'
              }`}
            >
              {isGoing ? 'Não vou mais!' : 'Eu vou!'}
            </button>

            <a
              href={p.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg text-center hover:bg-gray-200 transition-colors"
            >
              Ver no blocosderua.com
            </a>
            <p className="text-xs text-gray-400 text-center mt-2">
              Guardamos um identificador anônimo no seu navegador para lembrar suas confirmações.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
