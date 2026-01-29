interface InfoModalProps {
  onClose: () => void;
}

export function InfoModal({ onClose }: InfoModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-[90%] max-w-sm rounded-xl overflow-hidden"
        style={{
          backgroundColor: '#1F0914',
          color: '#F8F5FF',
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl leading-none opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: '#F8F5FF' }}
        >
          &times;
        </button>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Section 1 */}
          <div>
            <h2 className="text-xl mb-2" style={{ fontFamily: '"Instrument Serif", serif' }}>o quê é esse site?</h2>
            <p className="text-xs opacity-90">
              O CarnaMapa foi criado para facilitar a vida de quem quer curtir o carnaval de rua. Aqui você encontra todos os blocos de carnaval mapeados, com filtros por data, horário e preço.<br/><br/> Você pode até mandar pros seus amigos!
              </p>
          </div>

          {/* Section 2 */}
          <div>
            <h2 className="text-xl mb-2" style={{ fontFamily: '"Instrument Serif", serif' }}>quem fez ele?</h2>
            <p className="text-xs opacity-90">
              Eu, <a className="text-xs opacity-90 underline" href="https://falso.net">
              Igor
              </a>, pro o Carnaval 2026.
            </p>
          </div>

          {/* Section 3 */}
          <div>
            <h2 className="text-xl mb-2" style={{ fontFamily: '"Instrument Serif", serif' }}>de onde vêm os dados?</h2>
            <p className="text-xs opacity-90">
              Os dados dos blocos vêm do{' '}
              <a
                href="https://blocosderua.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-70 transition-opacity"
              >
                blocosderua.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
