import React, { useEffect, useRef } from 'react';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AnalysisResult } from '../lib/supabase';
import { BarChart3 } from 'lucide-react';

Chart.register(...registerables);

interface ResultsChartProps {
  results: AnalysisResult[];
}

export function ResultsChart({ results }: ResultsChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || results.length === 0) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: results.map(r => r.nome),
        datasets: [
          {
            label: 'Total de Operações',
            data: results.map(r => r.totalOp),
            backgroundColor: 'rgba(37, 99, 235, 0.8)',
            borderColor: 'rgba(37, 99, 235, 1)',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          },
          {
            label: 'Operações com Ganho',
            data: results.map(r => r.totalGain),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          },
          {
            label: 'Operações com Perda',
            data: results.map(r => r.totalLoss),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Comparativo de Operações por Ativo',
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#1f2937'
          },
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                weight: '600'
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#f3f4f6',
            },
            ticks: {
              font: {
                size: 11,
                weight: '500'
              },
              color: '#6b7280'
            }
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 12,
                weight: '600'
              },
              color: '#374151'
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    };

    chartInstance.current = new Chart(ctx, config);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [results]);

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Gráfico de Resultados</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500">
          Execute uma análise para visualizar os resultados
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <BarChart3 className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Gráfico de Resultados</h3>
      </div>
      <div className="h-96">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}