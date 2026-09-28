import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, FileText, Database, Globe } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Tratamiento de Datos y Privacidad — PARTYLOT',
  description: 'Conoce cómo PARTYLOT protege tu privacidad, maneja tus datos personales y gestiona la interacción con contratos inteligentes.',
};

export default function PrivacyPolicyPage() {
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
          <Shield className="w-3.5 h-3.5" />
          <span>Legal & Cumplimiento</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-[#171512] dark:text-white tracking-tight">
          Política de Tratamiento de Datos y Privacidad
        </h1>
        <p className="text-xs sm:text-sm text-[#6F6A62] dark:text-[#A8A196] mt-2">
          Última actualización: Septiembre 2026 · Cumplimiento de Habeas Data, GDPR y Ley 1581 de 2012
        </p>
      </div>

      {/* Content Container */}
      <div className="space-y-6 text-sm leading-relaxed text-[#4A453E] dark:text-[#D5CFC4] bg-[#FFFDF8] dark:bg-[#1C1A16] p-6 sm:p-8 rounded-[28px] border border-black/8 dark:border-white/10 shadow-[0_8px_30px_rgba(65,48,25,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        
        {/* Section 1 */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#B89600] dark:text-[#F0DC00]" />
            1. Identificación y Alcance
          </h2>
          <p>
            PARTYLOT (&ldquo;la Plataforma&rdquo;, &ldquo;nosotros&rdquo;) es una aplicación social descentralizada diseñada para la organización de eventos privados, gestión comunitaria de gastos (Party Pots) y dinámicas sociales interactivas. Esta Política describe cómo recolectamos, almacenamos, tratamos y protegemos la información personal y los identificadores digitales de nuestros usuarios.
          </p>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#B89600] dark:text-[#F0DC00]" />
            2. Datos que Recolectamos
          </h2>
          <p className="mb-2">Para el correcto funcionamiento de las reuniones y mecánicas comunitarias, recolectamos:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li><strong>Identificadores criptográficos y de autenticación:</strong> Dirección pública de billetera EVM (a través de Privy Embedded Wallets) y tokens de sesión emitidos criptográficamente. Nunca tenemos acceso a tus llaves privadas.</li>
            <li><strong>Información de perfil:</strong> Nombre visible, @handle único, biografía, enlace a redes sociales y foto de perfil/avatar provista voluntariamente.</li>
            <li><strong>Actividad de eventos y grupos (Crews):</strong> Asistencias a fiestas (RSVP), votaciones anónimas o públicas en juegos comunitarios (Who&apos;s Most Likely, This or That, Trivia), recuerdos fotográficos subidos y registros de división de gastos.</li>
            <li><strong>Datos técnicos y de sesión:</strong> Preferencia de tema (claro/oscuro), idioma seleccionado, y tokens temporales almacenados localmente en tu navegador (LocalStorage/Cookies técnicas).</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#B89600] dark:text-[#F0DC00]" />
            3. Interacción con Blockchain y Transparencia Pública
          </h2>
          <p>
            Al interactuar con los contratos de tesorería comunitaria (Party Pot) o grafos sociales en la red Monad Testnet, ciertas transacciones (como depósitos, transferencias o atestaciones EAS) se registran de forma inmutable y pública en la cadena de bloques.
          </p>
          <p className="mt-2 text-xs bg-black/[0.03] dark:bg-white/[0.04] p-3 rounded-xl border border-black/5 dark:border-white/5">
            ⚠️ <strong>Aviso Web3:</strong> Los registros on-chain son públicos por naturaleza de la tecnología blockchain y no pueden ser modificados ni eliminados unilateralmente una vez confirmados en bloque.
          </p>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#B89600] dark:text-[#F0DC00]" />
            4. Política de Cookies y Almacenamiento Local
          </h2>
          <p>
            PARTYLOT no utiliza cookies de rastreo publicitario invasivo de terceros. Empleamos exclusivamente:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 mt-1.5 text-xs sm:text-sm">
            <li><strong>Cookies estrictamente técnicas y esenciales:</strong> Para mantener la sesión de autenticación activa y segura (Privy Auth).</li>
            <li><strong>Almacenamiento Local (LocalStorage):</strong> Para persistir tus preferencias de interfaz (modo oscuro/claro, idioma y caché de estado de fiestas para carga instantánea).</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2">
            5. Derechos del Titular (Habeas Data & GDPR)
          </h2>
          <p>
            Tienes derecho a conocer, actualizar, rectificar y solicitar la supresión de tus datos personales alojados en nuestras bases de datos fuera de cadena (Supabase). Puedes ejercer tus derechos configurando la privacidad de tu perfil directamente desde la aplicación o contactando a nuestro equipo de soporte.
          </p>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2">
            6. Contacto y Consultas
          </h2>
          <p>
            Para consultas relacionadas con la privacidad, tratamiento de datos o reportes de seguridad, puedes comunicarte a través de los canales comunitarios de PARTYLOT o escribir a <code className="bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded text-xs">privacy@partylot.xyz</code>.
          </p>
        </section>
      </div>

      {/* Footer navigation */}
      <div className="mt-8 text-center text-xs text-[#6F6A62] dark:text-[#A8A196]">
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link href="/terms" className="hover:underline font-bold">Términos de Servicio</Link>
          <span>·</span>
          <Link href="/stats" className="hover:underline font-bold">Métricas y Stats On-Chain</Link>
        </div>
        <p>© {new Date().getFullYear()} PARTYLOT. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}
