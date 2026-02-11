
import { CalculatorInput, CalculationResult, CalculationResultItem, TerminationType } from '../types';
import { addDays, differenceInMonths, differenceInYears } from '../lib/utils';

export const calculateRescisao = (input: CalculatorInput): CalculationResult => {
  const items: CalculationResultItem[] = [];
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  
  // 1. Calculate Base Components (Month's Reference)
  const salary = input.salary;
  
  // Periculosidade (30% on Base Salary)
  const dangerPay = input.additionalDanger ? salary * 0.30 : 0;
  
  // Night Shift (Estimated 20% if checked - usually requires average, here we estimate on full salary for simplicity or use as a flag for average)
  // To make it robust based on prompt, we assume the boolean enables the calculation on base.
  const nightPay = input.additionalNight ? salary * 0.20 : 0;
  const dsrNightPay = input.additionalNight ? nightPay / 6 : 0; // Approx 1/6 for DSR

  // Overtime (Input is now treated as Average Value in R$)
  const overtimePay = input.additionalHours; 
  const dsrOvertimePay = overtimePay > 0 ? overtimePay / 6 : 0; // Approx 1/6 for DSR

  // TOTAL REMUNERATION BASIS FOR RESCISSION
  // Súmula TST: The basis includes habitual overtime and other additionals.
  const remunerationBasis = salary + dangerPay + nightPay + dsrNightPay + overtimePay + dsrOvertimePay;

  // --- Add Monthly Reference Items to the List (Standard Month View) ---
  // Note: These are added to show composition, but in a pure Rescisao context, 
  // we usually show "Saldo de Salário" calculating based on this global daily rate,
  // or show the averages separately. Here we list them as 'Integrations'.
  
  if (dangerPay > 0) {
      items.push({
          description: 'Adicional de Periculosidade (30%)',
          reference: 'Base Mensal',
          value: dangerPay,
          calculationBasis: salary,
          type: 'earning',
          group: 'Outros'
      });
  }

  if (nightPay > 0) {
       items.push({
          description: 'Adicional Noturno (20%)',
          reference: 'Média Estimada',
          value: nightPay,
          calculationBasis: salary,
          type: 'earning',
          group: 'Outros'
      });
      items.push({
          description: 'DSR s/ Adicional Noturno',
          reference: 'Reflexo (1/6)',
          value: dsrNightPay,
          calculationBasis: nightPay,
          type: 'earning',
          group: 'Outros'
      });
  }

  if (overtimePay > 0) {
      items.push({
          description: 'Média Horas Extras',
          reference: 'Média Valor',
          value: overtimePay,
          calculationBasis: overtimePay,
          type: 'earning',
          group: 'Outros'
      });
      items.push({
          description: 'DSR s/ Horas Extras',
          reference: 'Reflexo (1/6)',
          value: dsrOvertimePay,
          calculationBasis: overtimePay,
          type: 'earning',
          group: 'Outros'
      });
  }

  // --- Start Rescission Calculations ---

  let noticeDays = 0;
  let projectedEnd = new Date(end);

  // 1. Aviso Prévio Logic
  if (input.terminationType === TerminationType.SEM_JUSTA_CAUSA || input.terminationType === TerminationType.CULPA_RECIPROCA) {
    // Calculate statutory notice days based on years
    const fullYears = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    noticeDays = 30 + (fullYears * 3);
    if (noticeDays > 90) noticeDays = 90;

    if (input.noticeType === 'Indenizado') {
      items.push({
        description: 'Aviso Prévio Indenizado',
        reference: `${noticeDays} dias`,
        value: (remunerationBasis / 30) * noticeDays,
        calculationBasis: remunerationBasis,
        type: 'earning',
        group: 'Rescisórias'
      });
      // Projection logic
      projectedEnd = addDays(end, noticeDays);
    } else if (input.noticeType === 'Trabalhado' && input.noticeStartDate && input.noticeEndDate) {
        // Calculate worked days specifically
        const nStart = new Date(input.noticeStartDate);
        const nEnd = new Date(input.noticeEndDate);
        const diffTime = Math.abs(nEnd.getTime() - nStart.getTime());
        const daysWorkedNotice = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive

        const valWorkedNotice = (remunerationBasis / 30) * daysWorkedNotice;

        items.push({
            description: 'Saldo de Salário (Aviso Trabalhado)',
            reference: `${daysWorkedNotice} dias`,
            value: valWorkedNotice,
            calculationBasis: remunerationBasis,
            type: 'earning',
            group: 'Rescisórias'
        });

        // FGTS on Worked Notice
        items.push({
            description: 'FGTS s/ Aviso Trabalhado',
            reference: '8%',
            value: valWorkedNotice * 0.08,
            calculationBasis: valWorkedNotice,
            type: 'earning',
            group: 'FGTS'
        });
        
        projectedEnd = nEnd > end ? nEnd : end;
    }
  } else if (input.terminationType === TerminationType.PEDIDO_DEMISSAO) {
      if (input.noticeType === 'Dispensado/Não Cumprido') { 
          items.push({
              description: 'Desconto Aviso Prévio',
              reference: '30 dias',
              value: salary, // Deduction usually on base salary, sometimes total. Using salary is safer/standard.
              calculationBasis: salary,
              type: 'deduction',
              group: 'Rescisórias'
          });
      } else if (input.noticeType === 'Trabalhado' && input.noticeStartDate && input.noticeEndDate) {
           const nStart = new Date(input.noticeStartDate);
           const nEnd = new Date(input.noticeEndDate);
           const diffTime = Math.abs(nEnd.getTime() - nStart.getTime());
           const daysWorkedNotice = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
           
           items.push({
                description: 'Saldo de Salário (Aviso Trabalhado)',
                reference: `${daysWorkedNotice} dias`,
                value: (remunerationBasis / 30) * daysWorkedNotice,
                calculationBasis: remunerationBasis,
                type: 'earning',
                group: 'Rescisórias'
           });
      }
  }

  // 2. Saldo de Salário
  if (input.noticeType !== 'Trabalhado') {
    const daysWorkedInMonth = end.getDate(); 
    const saldoSalario = (remunerationBasis / 30) * daysWorkedInMonth;
    
    if (input.terminationType !== TerminationType.JUSTA_CAUSA) {
        items.push({
            description: 'Saldo de Salário',
            reference: `${daysWorkedInMonth} dias`,
            value: saldoSalario,
            calculationBasis: remunerationBasis,
            type: 'earning',
            group: 'Rescisórias'
        });
    } else {
        // Justa Causa only gets Balance of Salary
        items.push({
            description: 'Saldo de Salário',
            reference: `${daysWorkedInMonth} dias`,
            value: saldoSalario,
            calculationBasis: remunerationBasis,
            type: 'earning',
            group: 'Rescisórias'
        });
    }
  }

  // 3. Férias (Uses Remuneration Basis)
  if (input.vacationOverdue > 0 && input.terminationType !== TerminationType.JUSTA_CAUSA) {
    const val = remunerationBasis * input.vacationOverdue;
    items.push({
      description: 'Férias Vencidas',
      reference: `${input.vacationOverdue} período(s)`,
      value: val,
      calculationBasis: remunerationBasis,
      type: 'earning',
      group: 'Férias'
    });
    items.push({
      description: '1/3 Férias Vencidas',
      reference: '1/3 Constitucional',
      value: val / 3,
      calculationBasis: val,
      type: 'earning',
      group: 'Férias'
    });
  }

  // Proporcionais
  if (input.terminationType !== TerminationType.JUSTA_CAUSA) {
    let monthsVacation = 0;
    const lastAnniversary = new Date(start);
    lastAnniversary.setFullYear(projectedEnd.getFullYear());
    if (lastAnniversary > projectedEnd) {
        lastAnniversary.setFullYear(projectedEnd.getFullYear() - 1);
    }
    
    let diffTime = Math.abs(projectedEnd.getTime() - lastAnniversary.getTime());
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    monthsVacation = Math.floor(diffDays / 30);
    const remainderDays = diffDays % 30;
    if (remainderDays >= 15) monthsVacation += 1;
    if (monthsVacation > 12) monthsVacation = 12; 

    const valProp = (remunerationBasis / 12) * monthsVacation;
    items.push({
        description: 'Férias Proporcionais',
        reference: `${monthsVacation}/12 avos`,
        value: valProp,
        calculationBasis: remunerationBasis,
        type: 'earning',
        group: 'Férias'
    });
    items.push({
        description: '1/3 Férias Proporcionais',
        reference: '1/3 Constitucional',
        value: valProp / 3,
        calculationBasis: valProp,
        type: 'earning',
        group: 'Férias'
    });
  }

  // 4. 13º Salário (Uses Remuneration Basis)
  if (input.terminationType !== TerminationType.JUSTA_CAUSA) {
    const startOfYear = new Date(projectedEnd.getFullYear(), 0, 1);
    const effectiveStart = start > startOfYear ? start : startOfYear;
    
    let months13 = 0;
    let cursor = new Date(effectiveStart);
    while (cursor <= projectedEnd) {
        const endOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        const activeEnd = endOfMonth < projectedEnd ? endOfMonth : projectedEnd;
        const daysInMonth = activeEnd.getDate() - cursor.getDate() + 1;
        
        if (daysInMonth >= 15) months13++;
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    
    if (months13 > 12) months13 = 12;

    const val13 = (remunerationBasis / 12) * months13;
    items.push({
        description: '13º Salário Proporcional',
        reference: `${months13}/12 avos`,
        value: val13,
        calculationBasis: remunerationBasis,
        type: 'earning',
        group: '13º Salário'
    });
  }

  // 5. FGTS
  if (input.terminationType !== TerminationType.PEDIDO_DEMISSAO && input.terminationType !== TerminationType.JUSTA_CAUSA) {
      
      // Calculate FGTS on all earning items that are not "Férias" (Vacation Indemnified has no FGTS) or pure FGTS lines
      const earningsForGeneralFGTS = items.filter(i => 
          i.type === 'earning' && 
          i.group !== 'FGTS' &&
          i.group !== 'Férias' // Indemnified vacation usually NO FGTS
          && !i.description.includes('Aviso Trabalhado') // Handled specifically
      ).reduce((acc, curr) => acc + curr.value, 0);

      const fgtsGeneral = earningsForGeneralFGTS * 0.08;
      
      if (fgtsGeneral > 0) {
        items.push({
            description: 'FGTS sobre Rescisão',
            reference: '8%',
            value: fgtsGeneral,
            calculationBasis: earningsForGeneralFGTS,
            type: 'earning',
            group: 'FGTS'
        });
      }

      // Multa 40%
      if (input.terminationType === TerminationType.SEM_JUSTA_CAUSA) {
          const totalFGTSRescisao = items.filter(i => i.group === 'FGTS').reduce((acc, c) => acc + c.value, 0);
          const totalBaseFGTS = input.fgtsBalance + totalFGTSRescisao;
          items.push({
              description: 'Multa 40% FGTS',
              reference: '40% do saldo total',
              value: totalBaseFGTS * 0.4,
              calculationBasis: totalBaseFGTS,
              type: 'earning',
              group: 'Multas'
          });
      }
  }

  // 6. Multas Específicas
  if (input.applyFine477 && input.terminationType === TerminationType.SEM_JUSTA_CAUSA) {
      items.push({
          description: 'Multa Art. 477 CLT',
          reference: '1 Salário Base',
          value: salary, // Usually base salary
          calculationBasis: salary,
          type: 'earning',
          group: 'Multas'
      });
  }
  
  if (input.applyFine467) {
       const rescissoryTotal = items.filter(i => i.group === 'Rescisórias' && i.type === 'earning').reduce((acc, c) => acc + c.value, 0);
       items.push({
          description: 'Multa Art. 467 CLT',
          reference: '50% Verbas Incontroversas',
          value: rescissoryTotal * 0.5,
          calculationBasis: rescissoryTotal,
          type: 'earning',
          group: 'Multas'
      });
  }

  const totalEarnings = items.filter(i => i.type === 'earning').reduce((acc, i) => acc + i.value, 0);
  const totalDeductions = items.filter(i => i.type === 'deduction').reduce((acc, i) => acc + i.value, 0);

  return {
    items,
    totalEarnings,
    totalDeductions,
    netTotal: totalEarnings - totalDeductions,
    projectedEndDate: projectedEnd.toISOString().split('T')[0],
    noticeDays
  };
};
