import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { getScoreRulesAction, updateScoreRulesAction } from '@/lib/actions/settings';
import { MeinhaScoreRules, DEFAULT_RULES } from '@/lib/score-engine';

// ... (existing imports)

// Assuming AdminPanel contents... 
// I will just implement the ScoreConfig component here and then inject it into AdminPanel

export const ScoreConfigForm: React.FC = () => {
    const [rules, setRules] = useState<MeinhaScoreRules>(DEFAULT_RULES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        setLoading(true);
        const res = await getScoreRulesAction();
        if (res.success && res.rules) {
            setRules(res.rules);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        const res = await updateScoreRulesAction(rules);

        if (res.success) {
            setMessage({ type: 'success', text: 'Regras atualizadas com sucesso!' });
        } else {
            setMessage({ type: 'error', text: res.error || 'Erro ao salvar' });
        }
        setSaving(false);
    };

    const handleChange = (path: string, value: string) => {
        const numVal = parseFloat(value);
        if (process.env.NODE_ENV !== 'production') console.log(path, numVal);

        setRules(prev => {
            const newRules = { ...prev };
            const parts = path.split('.');

            if (parts.length === 1) {
                (newRules as any)[parts[0]] = numVal;
            } else if (parts.length === 2) {
                (newRules as any)[parts[0]] = {
                    ...(newRules as any)[parts[0]],
                    [parts[1]]: numVal
                };
            }
            return newRules;
        });
    };

    if (loading) return <div>Carregando configurações...</div>;

    return (
        <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700">
            <div className="border-b pb-4 mb-4">
                <h3 className="text-xl font-bold">Configuração do MeinhaScore</h3>
                <p className="text-gray-500 text-sm">Ajuste os valores de pontuação do sistema. Cuidado: Alterações afetam todos os usuários retroativamente!</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="font-bold text-lg text-blue-600">Gerais</h4>
                    <div className="form-group">
                        <label className="block text-sm font-medium">Score Inicial</label>
                        <input type="number" value={rules.initialScore} onChange={e => handleChange('initialScore', e.target.value)} className="w-full p-2 border rounded" />
                    </div>
                    <div className="form-group">
                        <label className="block text-sm font-medium">Criação de Dívida (Credor)</label>
                        <input type="number" value={rules.creditorCreation} onChange={e => handleChange('creditorCreation', e.target.value)} className="w-full p-2 border rounded" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold text-lg text-green-600">Bônus de Pagamento (Credor)</h4>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-xs">Antecipado</label>
                            <input type="number" value={rules.paymentBonus.early} onChange={e => handleChange('paymentBonus.early', e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="text-xs">No Dia</label>
                            <input type="number" value={rules.paymentBonus.onTime} onChange={e => handleChange('paymentBonus.onTime', e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="text-xs">Tolerância (2 dias)</label>
                            <input type="number" value={rules.paymentBonus.lateTolerance} onChange={e => handleChange('paymentBonus.lateTolerance', e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold text-lg text-green-600">Bônus de Pagamento (Devedor)</h4>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-xs">Antecipado</label>
                            <input type="number" value={rules.debtorBonus.early} onChange={e => handleChange('debtorBonus.early', e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="text-xs">No Dia</label>
                            <input type="number" value={rules.debtorBonus.onTime} onChange={e => handleChange('debtorBonus.onTime', e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="text-xs">Tolerância (2 dias)</label>
                            <input type="number" value={rules.debtorBonus.lateTolerance} onChange={e => handleChange('debtorBonus.lateTolerance', e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold text-lg text-red-600">Penalidades (Atraso)</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs">1-2 dias (se não pago na tol.)</label>
                            <input type="number" value={rules.penalties.late1to2} onChange={e => handleChange('penalties.late1to2', e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="text-xs">3-7 dias</label>
                            <input type="number" value={rules.penalties.late3to7} onChange={e => handleChange('penalties.late3to7', e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="text-xs">8-30 dias</label>
                            <input type="number" value={rules.penalties.late8to30} onChange={e => handleChange('penalties.late8to30', e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="text-xs">30+ dias</label>
                            <input type="number" value={rules.penalties.late30plus} onChange={e => handleChange('penalties.late30plus', e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold text-lg text-red-800">Calote e Vencimentos</h4>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-xs">Por semana vencida</label>
                            <input type="number" value={rules.penalties.overdueWeekly} onChange={e => handleChange('penalties.overdueWeekly', e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="text-xs">Max por dívida vencida</label>
                            <input type="number" value={rules.penalties.overdueMax} onChange={e => handleChange('penalties.overdueMax', e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="text-xs">Calote (>60d)</label>
                            <input type="number" value={rules.penalties.default} onChange={e => handleChange('penalties.default', e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </div>
    );
};
