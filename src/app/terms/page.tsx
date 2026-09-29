'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale, ShieldAlert, FileCheck, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';

export default function TermsOfServicePage() {
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
          <Scale className="w-3.5 h-3.5" />
          <span>{isEs ? 'Acuerdo Legal Internacional' : 'Global User Agreement'}</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-[#171512] dark:text-white tracking-tight">
          {isEs ? 'Términos de Servicio y Condiciones Internacionales de Uso' : 'International Terms of Service & User Agreement'}
        </h1>
        <p className="text-xs sm:text-sm text-[#6F6A62] dark:text-[#A8A196] mt-2">
          {isEs
            ? 'Vigencia global · Software descentralizado, no-custodia de fondos y responsabilidad comunitaria.'
            : 'Worldwide validity · Decentralized software license, non-custodial operations, and community guidelines.'}
        </p>
      </div>

      {/* Content Container */}
      <div className="space-y-6 text-sm leading-relaxed text-[#4A453E] dark:text-[#D5CFC4] bg-[#FFFDF8] dark:bg-[#1C1A16] p-6 sm:p-8 rounded-[28px] border border-black/8 dark:border-white/10 shadow-[0_8px_30px_rgba(65,48,25,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        
        {/* Section 1: Acceptance & Eligibility */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#B89600] dark:text-[#F0DC00]" />
            {isEs ? '1. Aceptación de los Términos y Elegibilidad' : '1. Acceptance & International Eligibility'}
          </h2>
          <p>
            {isEs
              ? 'Al acceder, conectar una billetera o interactuar con PARTYLOT, aceptas someterte a estos Términos de Servicio. Declaras que posees la edad legal de mayoría de edad en tu jurisdicción de residencia (al menos 18 años o la edad requerida por la ley local) y que no te encuentras en listas de sanciones financieras internacionales (OFAC, UE, ONU).'
              : 'By accessing, connecting a cryptographic wallet, or interacting with PARTYLOT, you agree to be bound by these Terms of Service. You represent and warrant that you are of legal age of majority in your jurisdiction of residence (at least 18 years old or local statutory threshold) and are not subject to international sanctions restrictions (OFAC, EU, UN).'}
          </p>
        </section>

        {/* Section 2: Non-Custodial Architecture */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#B89600] dark:text-[#F0DC00]" />
            {isEs ? '2. Arquitectura de No Custodia y Contratos Inteligentes' : '2. Non-Custodial Architecture & Smart Contracts'}
          </h2>
          <p>
            {isEs
              ? 'PARTYLOT proporciona una interfaz de software para interactuar con contratos inteligentes desplegados de forma autónoma en la red Monad. PARTYLOT NO es un banco, custodio, fiduciaria ni transmisor de dinero.'
              : 'PARTYLOT provides frontend software tooling to interact with autonomous smart contracts on Monad. PARTYLOT is NOT a bank, custodian, fiduciary, or money transmission service.'}
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 mt-2 text-xs sm:text-sm">
            <li>
              <strong>{isEs ? 'Auto-custodia:' : 'Self-Custody:'}</strong>{' '}
              {isEs
                ? 'Los usuarios gestionan sus billeteras mediante tecnología MPC de Privy. Solo tú tienes control de tus fondos.'
                : 'Users manage cryptographic keys via Privy’s non-custodial MPC technology. You retain sole custody and responsibility for your digital assets.'}
            </li>
            <li>
              <strong>{isEs ? 'Party Pots Comunitarios:' : 'Community Party Pots:'}</strong>{' '}
              {isEs
                ? 'Los fondos aportados a un Party Pot se transfieren directamente a los contratos inteligentes de la fiesta para cubrir gastos compartidos, botes o recompensas. La plataforma no puede congelar, retener ni desviar dichos fondos.'
                : 'Funds contributed to a Party Pot are locked and managed directly by party smart contracts for event expenses, damage splits, or bounties. The platform cannot freeze, seize, or reallocate your funds.'}
            </li>
          </ul>
        </section>

        {/* Section 3: Physical Event Host Liability */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            {isEs ? '3. Responsabilidad de Eventos Presenciales' : '3. Physical Gathering Host Liability'}
          </h2>
          <p>
            {isEs
              ? 'Los anfitriones (Hosts) y miembros de las Crews organizan eventos de forma totalmente independiente. PARTYLOT no inspecciona, asegura, patrocina ni controla los locales físicos, la venta de alimentos, bebidas alcohólicas o la seguridad de las reuniones. Cada participante asiste bajo su propia responsabilidad.'
              : 'Event hosts and crew creators coordinate in-person gatherings independently. PARTYLOT does not supervise, insure, endorse, or control physical venues, hospitality, alcohol consumption, or attendee conduct. Attendance is entirely at your own risk and discretion.'}
          </p>
        </section>

        {/* Section 4: No Financial Advice */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2">
            {isEs ? '4. Exención de Asesoría Financiera o de Inversión' : '4. No Financial or Investment Advice'}
          </h2>
          <p>
            {isEs
              ? 'Ningún componente de la aplicación constituye asesoría financiera, tributaria ni legal. Los Party Pots y saldos en tokens (MON, USDC) son herramientas funcionales para dividir gastos sociales y no representan instrumentos de inversión ni productos con rentabilidad esperada.'
              : 'Nothing contained within the platform constitutes investment, tax, or legal advice. Party Pots and token balances (MON, USDC) are functional utility tools for peer-to-peer social expense splitting, not financial yields or securities.'}
          </p>
        </section>

        {/* Section 5: Limitation of Liability */}
        <section>
          <h2 className="font-display font-bold text-lg text-[#171512] dark:text-white mb-2">
            {isEs ? '5. Limitación de Responsabilidad' : '5. Limitation of Liability'}
          </h2>
          <p>
            {isEs
              ? 'En la máxima medida permitida por la ley aplicable, PARTYLOT no será responsable por pérdidas indirectas, errores en transacciones de blockchain, fluctuaciones de red en Monad, o fallas en proveedores de infraestructura descentralizada.'
              : 'To the maximum extent permitted by applicable law, PARTYLOT shall not be liable for any indirect, incidental, or consequential damages resulting from smart contract bugs, RPC latency, gas fluctuations, or blockchain network reorganizations.'}
          </p>
        </section>

        {/* Section 6: Jurisdiction */}
        <section className="pt-2 border-t border-black/5 dark:border-white/10">
          <h2 className="font-display font-bold text-base text-[#171512] dark:text-white mb-1">
            {isEs ? '6. Resolución de Disputas y Ley Aplicable' : '6. Dispute Resolution & Governing Framework'}
          </h2>
          <p className="text-xs">
            {isEs
              ? 'Cualquier controversia se resolverá preferentemente mediante negociación amigable o arbitraje comercial digital antes de recurrir a cortes ordinarias.'
              : 'Any controversy or claim arising from these Terms shall be resolved via good-faith negotiation or digital commercial arbitration prior to formal court adjudication.'}
          </p>
        </section>
      </div>

      {/* Footer navigation */}
      <div className="mt-8 text-center text-xs text-[#6F6A62] dark:text-[#A8A196]">
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link href="/privacy" className="hover:underline font-bold">
            {isEs ? 'Política de Privacidad' : 'Privacy Policy'}
          </Link>
          <span>·</span>
          <Link href="/stats" className="hover:underline font-bold">
            {isEs ? 'Métricas y Stats en Vivo' : 'Live Ecosystem Stats'}
          </Link>
        </div>
        <p>© {new Date().getFullYear()} PARTYLOT. {isEs ? 'Acuerdo de usuario y software abierto.' : 'User agreement and open software.'}</p>
      </div>
    </div>
  );
}
