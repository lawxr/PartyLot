'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, FileText, Database, Globe, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';

export default function PrivacyPolicyPage() {
  const { language } = useTranslation();
  const isEs = language === 'es';

  return (
    <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] text-[#171512] dark:text-[#F5F1E8] py-8 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto transition-colors">
      {/* Back Header & Language Switch */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6F6A62] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isEs ? 'Volver a Partylot' : 'Back to Partylot'}</span>
        </Link>
        <LanguageSwitch compact />
      </div>

      {/* Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0DC00]/20 text-[#B89600] dark:text-[#F0DC00] text-xs font-extrabold tracking-wider uppercase mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>{isEs ? 'Legal & Cumplimiento Internacional' : 'Global Legal & Privacy Compliance'}</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-[#171512] dark:text-white tracking-tight">
          {isEs ? 'Política Internacional de Privacidad y Tratamiento de Datos' : 'International Privacy & Data Protection Policy'}
        </h1>
        <p className="text-xs sm:text-sm text-[#6F6A62] dark:text-[#A8A196] mt-2">
          {isEs
            ? 'Vigencia global · Cumplimiento de GDPR (UE), CCPA/CPRA (EE. UU.), LGPD (Brasil), Habeas Data y estándares Web3.'
            : 'Global validity · Fully compliant with GDPR (EU), CCPA/CPRA (US), LGPD (Brazil), Habeas Data & Web3 standards.'}
        </p>
      </div>

      {/* Content Container */}
      <div className="space-y-6 text-sm leading-relaxed text-[#4A453E] dark:text-[#D5CFC4] bg-[#FFFDF8] dark:bg-[#1C1A16] p-6 sm:p-8 rounded-[28px] border border-black/8 dark:border-white/10 shadow-[0_8px_30px_rgba(65,48,25,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        
        {/* Section 1: Introduction */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#B89600] dark:text-[#F0DC00]" />
            {isEs ? '1. Compromiso Global y Alcance' : '1. Global Commitment & Scope'}
          </h2>
          <p>
            {isEs
              ? 'PARTYLOT ("la Plataforma", "nosotros") opera como una aplicación social descentralizada para la coordinación de eventos privados, tesorerías grupales (Party Pots) y dinámicas comunitarias. Respetamos los más estrictos estándares internacionales de privacidad, incluyendo el Reglamento General de Protección de Datos de la Unión Europea (GDPR), la Ley de Privacidad del Consumidor de California (CCPA/CPRA), la Ley General de Protección de Datos de Brasil (LGPD) y las leyes de Habeas Data en América Latina (ej. Ley 1581 de 2012).'
              : 'PARTYLOT ("the Platform", "we", "us") operates as a decentralized social application for coordinating private gatherings, shared group treasuries (Party Pots), and interactive community dynamics. We adhere to the highest international data protection standards, including the EU General Data Protection Regulation (GDPR), the California Consumer Privacy Act / California Privacy Rights Act (CCPA/CPRA), Brazil’s LGPD, and Latin American Habeas Data frameworks.'}
          </p>
        </section>

        {/* Section 2: Data Collection */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#B89600] dark:text-[#F0DC00]" />
            {isEs ? '2. Datos que Recolectamos y Finalidad' : '2. Information We Collect & Purpose'}
          </h2>
          <p className="mb-2">
            {isEs
              ? 'Bajo el principio de minimización de datos (GDPR Art. 5), únicamente procesamos la información estrictamente necesaria:'
              : 'Under the principle of data minimization (GDPR Art. 5), we only process data strictly necessary for our social mechanics:'}
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li>
              <strong>{isEs ? 'Identificadores Criptográficos:' : 'Cryptographic Identifiers:'}</strong>{' '}
              {isEs
                ? 'Dirección pública de billetera EVM generada a través de Privy Embedded Wallets. PARTYLOT no custodia ni tiene acceso a tus llaves privadas.'
                : 'Public EVM wallet addresses provisioned via Privy Embedded Wallets. PARTYLOT never holds or has access to your private keys.'}
            </li>
            <li>
              <strong>{isEs ? 'Datos de Perfil:' : 'Profile Information:'}</strong>{' '}
              {isEs
                ? 'Nombre visible, identificador @handle único, biografía, redes sociales y avatar subido voluntariamente.'
                : 'Display name, unique @handle, bio, linked socials, and avatar voluntarily provided.'}
            </li>
            <li>
              <strong>{isEs ? 'Actividad Comunitaria & Noches:' : 'Community Activity & Gatherings:'}</strong>{' '}
              {isEs
                ? 'Confirmaciones de asistencia (RSVP), votos en juegos en tiempo real (Who\'s Most Likely, This or That, Trivia), recuerdos multimedia y registros de división de gastos.'
                : 'RSVP status, real-time game dilemma responses (Who\'s Most Likely, This or That, Trivia), uploaded event memories, and expense split settlements.'}
            </li>
            <li>
              <strong>{isEs ? 'Preferencias Locales:' : 'Local Preferences:'}</strong>{' '}
              {isEs
                ? 'Tokens de sesión en almacenamiento local (LocalStorage) para preservar tema claro/oscuro, idioma y caché de navegación rápida.'
                : 'Session tokens in browser LocalStorage to preserve theme preferences (light/dark), active language, and fast navigation cache.'}
            </li>
          </ul>
        </section>

        {/* Section 3: Web3 & Blockchain Transparency */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#B89600] dark:text-[#F0DC00]" />
            {isEs ? '3. Naturaleza Pública de Blockchain (Monad Testnet)' : '3. Public Nature of Blockchain (Monad Testnet)'}
          </h2>
          <p>
            {isEs
              ? 'Cuando participas en depósitos de tesorería (Party Pot) o atestaciones de grafo social en la red Monad Testnet, dichas transacciones son registradas de forma permanente y verificable en un libro contable descentralizado.'
              : 'When interacting with group treasury deposits (Party Pot) or social graph attestations on Monad Testnet, transaction hashes, block numbers, and public addresses are permanently recorded on an immutable decentralized ledger.'}
          </p>
          <div className="mt-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>{isEs ? 'Aviso Internacional de Inmutabilidad:' : 'International Immutability Disclosure:'}</strong>{' '}
              {isEs
                ? 'Las transacciones en la blockchain no pueden ser alteradas ni eliminadas unilateralmente. Recomendamos a los usuarios no incluir datos personales identificables (PII) directamente en mensajes o transferencias on-chain.'
                : 'Blockchain transactions cannot be altered, amended, or erased unilaterally once verified in a block. We advise users never to submit personally identifiable information (PII) within on-chain transaction data.'}
            </div>
          </div>
        </section>

        {/* Section 4: GDPR / CCPA / LGPD Specific Rights */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#B89600] dark:text-[#F0DC00]" />
            {isEs ? '4. Tus Derechos Internacionales (GDPR, CCPA, LGPD)' : '4. Your International Rights (GDPR, CCPA, LGPD)'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
              <span className="font-bold text-[#171512] dark:text-white block mb-1">
                {isEs ? '🇪🇺 Unión Europea (GDPR)' : '🇪🇺 European Union (GDPR)'}
              </span>
              <p className="text-[#6F6A62] dark:text-[#A8A196]">
                {isEs
                  ? 'Derecho de acceso, rectificación, portabilidad, limitación del tratamiento y derecho al olvido (supresión de datos alojados en base de datos off-chain).'
                  : 'Right of access, rectification, portability, restriction of processing, and right to be forgotten (erasure of off-chain database records).'}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
              <span className="font-bold text-[#171512] dark:text-white block mb-1">
                {isEs ? '🇺🇸 Estados Unidos (CCPA/CPRA)' : '🇺🇸 United States (CCPA/CPRA)'}
              </span>
              <p className="text-[#6F6A62] dark:text-[#A8A196]">
                {isEs
                  ? 'Derecho a conocer qué información se recopila. Declaramos expresamente que PARTYLOT NO vende ni comparte tus datos personales con fines publicitarios de terceros.'
                  : 'Right to know and delete personal data. PARTYLOT explicitly DOES NOT sell or share personal information for third-party commercial exploitation.'}
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Cookies & Storage */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2">
            {isEs ? '5. Política de Cookies y Almacenamiento Local' : '5. Cookies & Local Storage Directive'}
          </h2>
          <p>
            {isEs
              ? 'No empleamos trackers publicitarios ni píxeles invasivos de seguimiento. Únicamente utilizamos cookies estrictamente funcionales para la autenticación Web3 y almacenamiento local (LocalStorage) para la persistencia del estado en el cliente.'
              : 'We do not utilize third-party advertising cookies or cross-site tracking pixels. We solely employ strictly necessary cookies for Web3 authentication and client-side LocalStorage to preserve your user experience.'}
          </p>
        </section>

        {/* Section 6: Contact */}
        <section className="pt-2 border-t border-black/5 dark:border-white/10">
          <h2 className="font-display font-bold text-base text-[#171512] dark:text-white mb-1">
            {isEs ? '6. Contacto del Oficial de Protección de Datos (DPO)' : '6. Data Protection Officer (DPO) Contact'}
          </h2>
          <p className="text-xs">
            {isEs
              ? 'Para ejercer tus derechos o realizar consultas legales sobre tratamiento de datos, puedes comunicarte con nuestro equipo en:'
              : 'To exercise your rights or submit inquiries regarding international privacy compliance, contact our team at:'}{' '}
            <code className="bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded font-mono text-xs text-[#171512] dark:text-white">
              privacy@partylot.xyz
            </code>
          </p>
        </section>
      </div>

      {/* Footer navigation */}
      <div className="mt-8 text-center text-xs text-[#6F6A62] dark:text-[#A8A196]">
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link href="/terms" className="hover:underline font-bold">
            {isEs ? 'Términos de Servicio' : 'Terms of Service'}
          </Link>
          <span>·</span>
          <Link href="/stats" className="hover:underline font-bold">
            {isEs ? 'Métricas y Stats en Vivo' : 'Live Ecosystem Stats'}
          </Link>
        </div>
        <p>© {new Date().getFullYear()} PARTYLOT. {isEs ? 'Privacidad y cumplimiento descentralizado.' : 'Decentralized privacy and compliance.'}</p>
      </div>
    </div>
  );
}
