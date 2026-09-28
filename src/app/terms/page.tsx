import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones de Uso — PARTYLOT',
  description: 'Términos y condiciones para el uso de la aplicación comunitaria y tesorerías descentralizadas de PARTYLOT.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] py-8 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto transition-colors">
      {/* Back Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Partylot</span>
        </Link>
      </div>

      {/* Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0DC00]/20 text-[#B89600] dark:text-[#F0DC00] text-xs font-extrabold tracking-wider uppercase mb-3">
          <Scale className="w-3.5 h-3.5" />
          <span>Acuerdo Legal</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-[#171512] dark:text-white tracking-tight">
          Términos de Servicio y Condiciones de Uso
        </h1>
        <p className="text-xs sm:text-sm text-[#6F6A62] dark:text-[#A8A196] mt-2">
          Última actualización: Septiembre 2026
        </p>
      </div>

      {/* Content Container */}
      <div className="space-y-6 text-sm leading-relaxed text-[#4A453E] dark:text-[#D5CFC4] bg-[#FFFDF8] dark:bg-[#1C1A16] p-6 sm:p-8 rounded-[28px] border border-black/8 dark:border-white/10 shadow-[0_8px_30px_rgba(65,48,25,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2">
            1. Aceptación de los Términos
          </h2>
          <p>
            Al acceder, registrarte o interactuar con PARTYLOT, aceptas quedar vinculado por estos Términos de Servicio. Si no estás de acuerdo con alguna parte, deberás abstenerte de utilizar la plataforma.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2">
            2. Naturaleza del Servicio y No Custodia
          </h2>
          <p>
            PARTYLOT proporciona herramientas de software para la coordinación de eventos sociales y la interacción con contratos inteligentes en la red Monad.
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 mt-2 text-xs sm:text-sm">
            <li><strong>No custodia de fondos:</strong> PARTYLOT no es un banco, intermediario financiero ni custodio. Los fondos depositados en los Party Pots son administrados por contratos inteligentes autónomos y billeteras auto-custodiadas (Privy).</li>
            <li><strong>Responsabilidad del organizador (Host):</strong> Los anfitriones son responsables directos de las condiciones de sus eventos físicos y del manejo honesto de las recaudaciones comunitarias.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2">
            3. Conducta Comunitaria y Contenido
          </h2>
          <p>
            Los usuarios se comprometen a respetar la convivencia armónica en las reuniones y en el contenido digital subido (fotos de recuerdos, nombres de crews, preguntas de trivia). Queda terminantemente prohibido el acoso, la suplantación de identidad o el uso de la plataforma para actividades ilícitas.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2">
            4. Limitación de Responsabilidad
          </h2>
          <p>
            La plataforma se proporciona &ldquo;tal cual&rdquo; (&ldquo;as is&rdquo;) sin garantías de ningún tipo respecto a interrupciones de red blockchain, congestión de nodos RPC o incidentes en eventos presenciales organizados por terceros.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2">
            5. Modificaciones
          </h2>
          <p>
            Nos reservamos el derecho de modificar estos términos periódicamente para reflejar mejoras técnicas o requerimientos legales. La continuación en el uso del servicio constituye aceptación de dichos cambios.
          </p>
        </section>
      </div>

      {/* Footer navigation */}
      <div className="mt-8 text-center text-xs text-[#6F6A62] dark:text-[#A8A196]">
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link href="/privacy" className="hover:underline font-bold">Política de Privacidad</Link>
          <span>·</span>
          <Link href="/stats" className="hover:underline font-bold">Métricas y Stats On-Chain</Link>
        </div>
        <p>© {new Date().getFullYear()} PARTYLOT. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}
