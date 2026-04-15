
import React, { useEffect, useState } from 'react';
import { useForm, UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Language } from '../../../types';
import { zPeticaoExtrairDadosSchema } from '../../../schemas';
import { z } from 'zod';

type FormData = z.infer<typeof zPeticaoExtrairDadosSchema>;

interface PetitionDataReviewProps {
    initialData?: Record<string, any>;
    summaryContent?: string;
    onConfirm: (data: FormData) => void;
    isLoading: boolean;
    language: Language;
}

const FormField: React.FC<{ 
    label: string; 
    id: keyof FormData; 
    register: UseFormRegister<FormData>;
    placeholder?: string; 
    type?: 'input' | 'textarea'; 
    required?: boolean; 
    disabled: boolean; 
    rows?: number; 
}> = ({ label, id, register, placeholder, type = 'input', required, disabled, rows = 3 }) => (
    <div>
        <label htmlFor={id as string} className="block text-sm font-semibold text-slate-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === 'textarea' ? (
            <textarea 
                id={id as string}
                placeholder={placeholder}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 text-slate-700"
                rows={rows}
                disabled={disabled}
                {...register(id)}
            />
        ) : (
            <input 
                id={id as string}
                type="text" 
                placeholder={placeholder}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 text-slate-700"
                disabled={disabled}
                {...register(id)}
            />
        )}
    </div>
);

export const PetitionDataReview: React.FC<PetitionDataReviewProps> = ({ initialData, summaryContent, onConfirm, isLoading, language }) => {
    const isPT = language === 'pt-BR';
    const [isFactsExpanded, setIsFactsExpanded] = useState(false);
    
    const { register, handleSubmit, reset, setValue } = useForm<FormData>({
        resolver: zodResolver(zPeticaoExtrairDadosSchema) as any,
        defaultValues: {
            facts: '', plaintiff: '', defendant: '', rights: '', hasInjunction: false, requests: '', value: '', evidence: '',
        }
    });

    useEffect(() => {
        if (initialData) {
            const mappedData = {
                ...initialData,
                facts: summaryContent || '', 
                hasInjunction: typeof initialData.hasInjunction === 'boolean' 
                    ? initialData.hasInjunction 
                    : (initialData.injunction ? true : false) 
            };
            reset(mappedData);
        } else if (summaryContent) {
            setValue('facts', summaryContent);
        }
    }, [initialData, summaryContent, reset, setValue]);

    return (
        <form onSubmit={handleSubmit(onConfirm)} className="space-y-8 animate-fade-in max-w-4xl mx-auto">
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-700">{isPT ? "Relato Original dos Fatos" : "Original Statement of Facts"}</h3>
                    <button 
                        type="button" 
                        onClick={() => setIsFactsExpanded(!isFactsExpanded)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
                    >
                        {isFactsExpanded ? (isPT ? "Ler menos" : "Read less") : (isPT ? "Ler mais / Editar" : "Read more / Edit")}
                    </button>
                </div>
                
                <div className="relative">
                    <textarea 
                        {...register('facts')}
                        className={`w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 text-slate-700 leading-relaxed resize-y ${isFactsExpanded ? 'min-h-[400px]' : 'min-h-[120px] max-h-[120px]'}`}
                        disabled={isLoading}
                        placeholder={isPT ? "Edite o relato dos fatos aqui..." : "Edit the statement of facts here..."}
                    />
                    {!isFactsExpanded && (
                        <div 
                            className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent rounded-b-lg pointer-events-none"
                            aria-hidden="true"
                        />
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label={isPT ? "Autor (Qualificação)" : "Plaintiff"} id="plaintiff" register={register} placeholder={isPT ? "Nome, estado civil, profissão, CPF..." : "Name, marital status..."} type="textarea" disabled={isLoading} />
                    <FormField label={isPT ? "Réu (Qualificação)" : "Defendant"} id="defendant" register={register} placeholder={isPT ? "Nome, CNPJ/CPF, endereço..." : "Name, ID, address..."} type="textarea" disabled={isLoading} />
                </div>

                <FormField label={isPT ? "Fundamentos Jurídicos (a princípio)" : "Legal Grounds (Preliminary)"} id="rights" register={register} placeholder={isPT ? "Ex: Dano moral, inadimplemento contratual..." : "Ex: Moral damages, breach of contract..."} type="textarea" disabled={isLoading} rows={4} />

                <div>
                    <FormField label={isPT ? "Dos Pedidos" : "Requests"} id="requests" register={register} placeholder={isPT ? "Liste os pedidos finais. Ex: Condenação..." : "List the final requests..."} type="textarea" disabled={isLoading} rows={5} />
                    
                    {/* Injunction Checkbox - Moved below Requests and styled discreetly */}
                    <div className="mt-2 flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="hasInjunction" 
                            {...register('hasInjunction')}
                            disabled={isLoading}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="hasInjunction" className="text-sm text-slate-500 hover:text-slate-700 cursor-pointer select-none">
                            {isPT ? "Há pedido de Tutela de Urgência / Liminar" : "Includes request for Injunction / Preliminary Relief"}
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label={isPT ? "Valor da Causa" : "Value of the Cause"} id="value" register={register} placeholder={isPT ? "Ex: R$ 50.000,00" : "Ex: $50,000.00"} disabled={isLoading} />
                    <FormField label={isPT ? "Provas" : "Evidence"} id="evidence" register={register} placeholder={isPT ? "Ex: Documental, testemunhal..." : "Ex: Documentary, testimonial..."} disabled={isLoading} />
                </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-500 transition-colors shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {isPT ? "Próxima Etapa" : "Next Step"} &rarr;
                </button>
            </div>
        </form>
    );
};
