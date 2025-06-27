import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Static Data & Types ---

const TABLE_DECOTE: { [key: number]: number } = {
  10: 0.68, 11: 0.66, 12: 0.65, 13: 0.64, 14: 0.62,
  15: 0.59, 16: 0.58, 17: 0.56, 18: 0.55, 19: 0.54, 20: 0.53
};

type CalculMode = 'fromInitial' | 'fromFinal';

// --- Helper Components ---

interface InputSliderProps {
  label: string;
  unit: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min: number;
  max: number;
  step: number;
  id: string;
  disabled?: boolean;
}

const InputSlider: React.FC<InputSliderProps> = ({ label, unit, value, onChange, min, max, step, id, disabled }) => (
  <div className={disabled ? 'opacity-50' : ''}>
    <label className="text-gray-300 text-sm font-medium mb-2 block">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="font-bold text-[#00FFD2]">{value.toLocaleString('fr-FR')} {unit}</span>
      </div>
    </label>
    <input
      type="range" id={id} min={min} max={max} step={step} value={value}
      onChange={onChange} disabled={disabled}
      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
    />
  </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  // --- State Management ---
  const [dureeDemenbrement, setDureeDemenbrement] = useState<number>(15);
  const [capitalInitial, setCapitalInitial] = useState<number>(100000);
  const [capitalFinal, setCapitalFinal] = useState<number>(169491);
  const [calculMode, setCalculMode] = useState<CalculMode>('fromInitial');
  const [chartData, setChartData] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  // --- Calculation Engine ---
  useEffect(() => {
    const decote = TABLE_DECOTE[dureeDemenbrement] || 0.60;
    let newCapitalInitial = capitalInitial;
    let newCapitalFinal = capitalFinal;

    if (calculMode === 'fromInitial') {
      newCapitalFinal = capitalInitial / decote;
      setCapitalFinal(newCapitalFinal);
    } else { // 'fromFinal'
      newCapitalInitial = capitalFinal * decote;
      setCapitalInitial(newCapitalInitial);
    }
    
    setChartData([
        { name: 'Capital Investi (Nue-Propriété)', value: newCapitalInitial, fill: '#818cf8' },
        { name: 'Capital Récupéré (Pleine Propriété)', value: newCapitalFinal, fill: '#00FFD2' }
    ]);

  }, [dureeDemenbrement, capitalInitial, capitalFinal, calculMode]);

  const handleModeChange = (mode: CalculMode) => {
    setCalculMode(mode);
  };
  
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        setEmailMessage('Veuillez saisir une adresse e-mail valide.');
        return;
    }

    setIsSending(true);
    setEmailMessage('');

    const simulationData = {
        objectifs: {
            dureeDemenbrement: `${dureeDemenbrement} ans`,
            capitalInitial: `${capitalInitial.toLocaleString('fr-FR')} €`,
            capitalFinal: `${capitalFinal.toLocaleString('fr-FR')} €`,
        },
        resultats: {
            plusValue: `+ ${(capitalFinal - capitalInitial).toLocaleString('fr-FR', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0})}`,
            decote: `${((1 - (TABLE_DECOTE[dureeDemenbrement] || 0.60)) * 100).toFixed(0)}%`
        }
    };

    try {
        const response = await fetch('/.netlify/functions/send-simulation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, data: simulationData, theme: 'Démembrement' }),
        });

        if (!response.ok) {
            throw new Error('La réponse du serveur n\'est pas OK.');
        }

        setEmailMessage(`Votre simulation a bien été envoyée à ${email}.`);
        setEmail('');

    } catch (error) {
        console.error('Failed to send simulation:', error);
        setEmailMessage("Une erreur est survenue. Veuillez réessayer.");
    } finally {
        setIsSending(false);
        setTimeout(() => setEmailMessage(''), 5000);
    }
  };


  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-700 p-4 sm:p-8 font-sans flex items-center justify-center min-h-screen">
      <div className="bg-slate-800/50 backdrop-blur-sm ring-1 ring-white/10 p-6 sm:p-10 rounded-2xl shadow-2xl w-full max-w-5xl mx-auto">
        
        <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-100">
                Simulateur d'Investissement en Démembrement
            </h1>
            <p className="text-slate-300 mt-2">Découvrez comment acquérir un patrimoine immobilier avec une forte décote.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Left Column: Controls */}
            <div className="lg:col-span-2 bg-slate-700/50 p-6 rounded-lg shadow-inner ring-1 ring-white/10">
                <h2 className="text-2xl font-semibold text-[#00FFD2] mb-6">Votre Scénario</h2>
                
                <div className="grid grid-cols-2 gap-2 mb-6 bg-slate-900/50 p-1 rounded-lg">
                    <button onClick={() => handleModeChange('fromInitial')} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${calculMode === 'fromInitial' ? 'bg-[#00FFD2] text-slate-900' : 'text-slate-300'}`}>Je pars d'un capital</button>
                    <button onClick={() => handleModeChange('fromFinal')} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${calculMode === 'fromFinal' ? 'bg-[#00FFD2] text-slate-900' : 'text-slate-300'}`}>Je vise un capital</button>
                </div>

                <div className="space-y-6">
                    <InputSlider
                        id="dureeDemenbrement" label="Durée du démembrement" unit="ans"
                        value={dureeDemenbrement} onChange={(e) => setDureeDemenbrement(parseInt(e.target.value, 10))}
                        min={10} max={20} step={1}
                    />
                    <InputSlider
                        id="capitalInitial" label="Capital initial à investir" unit="€"
                        value={capitalInitial} onChange={(e) => setCapitalInitial(parseFloat(e.target.value))}
                        min={10000} max={500000} step={1000}
                        disabled={calculMode === 'fromFinal'}
                    />
                    <InputSlider
                        id="capitalFinal" label="Capital final souhaité" unit="€"
                        value={capitalFinal} onChange={(e) => setCapitalFinal(parseFloat(e.target.value))}
                        min={20000} max={1000000} step={10000}
                        disabled={calculMode === 'fromInitial'}
                    />
                </div>
            </div>
            
            {/* Right Column: Result */}
            <div className="lg:col-span-3 bg-slate-700/50 p-6 rounded-lg shadow-inner ring-1 ring-white/10 flex flex-col justify-start">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-[#00FFD2] mb-4">Votre Gain Potentiel</h2>
                    <p className="text-gray-300 mb-6">
                        En investissant en nue-propriété sur <span className="font-bold text-white">{dureeDemenbrement} ans</span>, vous bénéficiez d'une décote de <span className="font-bold text-white">{((1 - (TABLE_DECOTE[dureeDemenbrement] || 0.60)) * 100).toFixed(0)}%</span>.
                    </p>
                    
                    <div className="bg-emerald-100 p-6 rounded-lg text-center shadow">
                         <p className="text-sm font-semibold text-emerald-800">Plus-value mécanique à terme</p>
                        <p className="text-3xl md:text-4xl font-extrabold text-emerald-900 mt-1">
                            + {(capitalFinal - capitalInitial).toLocaleString('fr-FR', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0})}
                        </p>
                    </div>

                    <div className="mt-6 text-sm text-gray-400">
                        <p>Au terme de la période, vous récupérez la pleine propriété sans aucune fiscalité supplémentaire sur ce gain.</p>
                    </div>
                </div>

                <hr className="my-8 border-slate-600" />
                
                <div className="text-center">
                     <h3 className="text-lg font-semibold text-gray-100 mb-3">Concrétisez votre projet</h3>
                     <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Votre adresse e-mail"
                            className="flex-grow bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#00FFD2]"
                            required
                            disabled={isSending}
                        />
                        <button type="submit" className="bg-slate-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-slate-500 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSending}>
                            {isSending ? 'Envoi...' : 'Recevoir par e-mail'}
                        </button>
                    </form>
                    {emailMessage && <p className="text-sm text-emerald-400 mb-4">{emailMessage}</p>}

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                        <a href="https://www.aeterniapatrimoine.fr/solutions/scpi/" target="_blank" rel="noopener noreferrer" className="bg-[#00FFD2] text-slate-900 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-white transition-colors duration-300 w-full sm:w-auto">
                            Découvrir nos solutions
                        </a>
                        <a href="https://www.aeterniapatrimoine.fr/contact/" target="_blank" rel="noopener noreferrer" className="bg-transparent border-2 border-[#00FFD2] text-[#00FFD2] font-bold py-3 px-8 rounded-lg hover:bg-[#00FFD2] hover:text-slate-900 transition-colors duration-300 w-full sm:w-auto">
                            Être contacté
                        </a>
                    </div>
                </div>
            </div>
        </div>

        {/* Chart Section */}
        <div className="mt-8 bg-slate-700/50 p-6 rounded-lg shadow-inner ring-1 ring-white/10">
            <h2 className="text-2xl font-semibold text-[#00FFD2] mb-6 text-center">Visualisation de l'Investissement</h2>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis type="number" stroke="#94a3b8" tickFormatter={(value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(value)} />
                        <YAxis type="category" dataKey="name" stroke="#94a3b8" width={150} />
                        <Tooltip
                            cursor={{fill: 'rgba(71, 85, 105, 0.5)'}}
                            contentStyle={{ 
                                backgroundColor: '#f1f5f9', 
                                color: '#1e293b', 
                                border: '1px solid #cbd5e1', 
                                borderRadius: '0.5rem' 
                            }} 
                            formatter={(value: number) => value.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0})} 
                        />
                        <Bar dataKey="value" barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
        
        {/* Disclaimer Section */}
        <div className="text-center mt-10">
             <div className="text-xs text-slate-400 p-4 bg-slate-900/50 rounded-lg max-w-3xl mx-auto">
                <h3 className="font-semibold text-slate-300 mb-2">Hypothèses de calcul</h3>
                <p>La décote appliquée est une moyenne de marché et peut varier. La plus-value mécanique est calculée hors revalorisation potentielle du prix de la part. Cette simulation est non contractuelle et ne constitue pas un conseil en investissement.</p>
            </div>
        </div>
        
      </div>
    </div>
  );
};

export default App;
```


```javascript
// Fichier : netlify/functions/send-simulation.js
// Version corrigée et étendue pour gérer tous les thèmes de simulateurs

const { Resend } = require('resend');

// --- Helper function to format the main body of the email based on the theme ---
function getEmailBody(theme, data) {
    const { objectifs, resultats } = data;
    const commonFooter = `
        <p style="margin-top: 25px;">Pour discuter de ces résultats et mettre en place la stratégie la plus adaptée, n'hésitez pas à nous contacter.</p>
        <br>
        <p>Cordialement,</p>
        <p><strong>L'équipe Aeternia Patrimoine</strong></p>
    `;

    if (theme === 'Démembrement') {
        return `
            <h3 style="color: #333;">Vos paramètres :</h3>
            <ul style="list-style-type: none; padding-left: 0; border-left: 3px solid #00FFD2; padding-left: 15px;">
                <li><strong>Durée du démembrement :</strong> ${objectifs.dureeDemenbrement}</li>
                <li><strong>Capital initial investi (en nue-propriété) :</strong> ${objectifs.capitalInitial}</li>
                <li><strong>Capital final récupéré (en pleine propriété) :</strong> ${objectifs.capitalFinal}</li>
            </ul>

            <h3 style="color: #333;">Résultats de votre projet :</h3>
            <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 16px;">Grâce à une décote de <strong>${resultats.decote}</strong>, la plus-value mécanique à terme est de :</p>
                <p style="font-size: 24px; font-weight: bold; color: #00877a; margin: 10px 0;">${resultats.plusValue}</p>
                <p style="font-size: 14px; color: #555; margin: 0;">Ce gain est réalisé sans fiscalité supplémentaire au moment de la récupération de la pleine propriété.</p>
            </div>
            ${commonFooter}
        `;
    }

    // Default template for all other simulators
    const emailTemplates = {
        'default': { title: "le résumé de votre simulation", objectiveLabel: "Revenu mensuel souhaité" },
        'Aider un proche': { title: "le résumé de votre projet d'aide financière", objectiveLabel: "Aide mensuelle à verser" },
        'Études enfant': { title: "le résumé de votre projet pour les études de votre enfant", objectiveLabel: "Revenu mensuel pour ses études" },
        'Retraite': { title: "le résumé de votre projet de retraite", objectiveLabel: "Revenu mensuel souhaité à la retraite" },
        'Année sabbatique': { title: "le résumé de votre projet d'année sabbatique", objectiveLabel: "Budget mensuel nécessaire" },
        'Revenu Passif': { title: "le résumé de votre projet d'indépendance financière", objectiveLabel: "Revenu passif mensuel souhaité" }
    };
    const template = emailTemplates[theme] || emailTemplates['default'];

    return `
        <h3 style="color: #333;">Vos paramètres :</h3>
        <ul style="list-style-type: none; padding-left: 0; border-left: 3px solid #00FFD2; padding-left: 15px;">
            <li><strong>${template.objectiveLabel} :</strong> ${objectifs.revenuRecherche}</li>
            <li><strong>Durée de l'épargne :</strong> ${objectifs.dureePlacement}</li>
            <li><strong>Votre apport initial :</strong> ${objectifs.versementInitial}</li>
        </ul>

        <h3 style="color: #333;">Résultats de votre projet :</h3>
        <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 16px;">Pour atteindre votre objectif, votre effort d'épargne mensuel suggéré est de :</p>
            <p style="font-size: 24px; font-weight: bold; color: #00877a; margin: 10px 0;">${resultats.versementMensuelRequis} / mois</p>
            <p style="font-size: 14px; color: #555; margin: 0;">Cet effort vous permettrait de viser un capital final de <strong>${resultats.capitalVise}</strong>.</p>
        </div>
        ${commonFooter}
    `;
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = JSON.parse(event.body);
    
    const { email, data, theme } = body;

    // --- Data validation ---
    if (!data || typeof data.objectifs === 'undefined' || typeof data.resultats === 'undefined') {
        console.error("Données de simulation manquantes ou mal formatées :", body);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Données de simulation invalides." }),
        };
    }
    
    const emailSubjects = {
        'default': `Votre simulation d'épargne Aeternia Patrimoine`,
        'Aider un proche': `Votre simulation pour aider un proche`,
        'Études enfant': `Votre simulation pour les études de votre enfant`,
        'Retraite': `Votre simulation de retraite complémentaire`,
        'Année sabbatique': `Votre simulation pour votre année sabbatique`,
        'Revenu Passif': `Votre simulation d'indépendance financière`,
        'Démembrement': `Votre simulation d'investissement en démembrement`
    };

    const subject = emailSubjects[theme] || emailSubjects['default'];
    const emailBodyHtml = getEmailBody(theme, data);

    await resend.emails.send({
      from: 'Aeternia Patrimoine <contact@aeterniapatrimoine.fr>', 
      to: [email],
      bcc: ['contact@aeterniapatrimoine.fr'],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #333;">Bonjour,</h2>
          <p>Merci d'avoir utilisé notre simulateur.</p>
          
          ${emailBodyHtml}
          
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
          
          <p style="font-size: 10px; color: #777; text-align: center; margin-top: 20px;">
            Les informations et résultats fournis par ce simulateur sont donnés à titre indicatif et non contractuel. Ils sont basés sur les hypothèses de calcul et les paramètres que vous avez renseignés et ne constituent pas un conseil en investissement.
          </p>
        </div>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email envoyé avec succès !' }),
    };

  } catch (error) {
    console.error("Erreur dans la fonction Netlify :", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Une erreur est survenue lors de l'envoi de l'email." }),
    };
  }
};