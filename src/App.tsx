import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
            decote: `${((1 - TABLE_DECOTE[dureeDemenbrement]) * 100).toFixed(0)}%`
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
                        En investissant en nue-propriété sur <span className="font-bold text-white">{dureeDemenbrement} ans</span>, vous bénéficiez d'une décote de <span className="font-bold text-white">{((1 - TABLE_DECOTE[dureeDemenbrement]) * 100).toFixed(0)}%</span>.
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
        
      </div>
    </div>
  );
};

export default App;
