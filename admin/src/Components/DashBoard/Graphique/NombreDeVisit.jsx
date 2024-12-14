import React, { useState, useEffect } from "react";
import { AgCharts } from "ag-charts-react";
import { backend_url } from "../../../App";

const NombreDeVisit = () => {
    const [visitData, setVisitData] = useState([]);
    useEffect(() => {
      fetch(`${backend_url}/visits`)
        .then(response => response.json())
        .then(data => {
          // Regrouper les données par date
          const groupedData = {};
    
          data.forEach(item => {
            const date = new Date(item.visit_date);
            const dateString = date.toISOString().split('T')[0]; // Obtenir 'YYYY-MM-DD'
            
            if (groupedData[dateString]) {
              groupedData[dateString] += item.visit_count;
            } else {
              groupedData[dateString] = item.visit_count;
            }
          });
    
          // Convertir en tableau pour le graphique
          const formattedData = Object.entries(groupedData).map(([date, count]) => ({
            visit_date: new Date(date),
            visit_count: count,
          }));
    
          setVisitData(formattedData);
        })
        .catch(error => console.error('Erreur:', error));
    }, []);

    const visitChartOptions = {
      title: { text: 'Nombre de visites par jour.', fontSize: 18 },
      data: visitData,
      series: [
        {
        xKey: 'visit_date',
        yKey: 'visit_count',
        type: 'line',
        marker: { enabled: true },
        interpolation: {
          type: 'smooth'
        },
      }],
      axes: [
        {
          type: 'time',
          position: 'bottom',
          title: { text: 'Date' },
          label: {
            formatter: ({ value }) => {
              const date = new Date(value);
              return date.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: '2-digit',
              });
            },
          },
        },
        {
          type: 'number',
          position: 'left',
          title: { text: 'Visiteurs' },
        },
      ],
    };
    
  return (
    <div className="chart">
        <AgCharts options={visitChartOptions} />
    </div>
  )
};
export default NombreDeVisit;
