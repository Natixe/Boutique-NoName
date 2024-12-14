import React, { useState, useEffect } from "react";
import { AgCharts } from "ag-charts-react";
import { backend_url } from "../../../App";

const NumberOfAccountsCreated = () => {
  const [activeUsersData, setActiveUsersData] = useState([]);

  useEffect(() => {
    fetch(`${backend_url}/NumberOfAccountsCreated`)
      .then(response => response.json())
      .then(data => {
        // Regrouper les données par date
        const groupedData = {};
  
        data.forEach(item => {
          const date = new Date(item.signup_date);
          const dateString = date.toISOString().split('T')[0]; // Obtenir 'YYYY-MM-DD'
          
          if (groupedData[dateString]) {
            groupedData[dateString] += item.user_count;
          } else {
            groupedData[dateString] = item.user_count;
          }
        });
  
        // Convertir en tableau pour le graphique
        const formattedData = Object.entries(groupedData).map(([date, count]) => ({
          signup_date: new Date(date),
          user_count: count,
        }));
  
        setActiveUsersData(formattedData);
      })
      .catch(error => console.error('Erreur:', error));
  }, []);


  
  const activeUsersChartOptions = {
    data: activeUsersData,
    title: { text: 'Nombre de comptes créés par jour', fontSize: 18 },
    series: [{
      xKey: 'signup_date',
      yKey: 'user_count',
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
            return date.toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
            });
          },
        },
      },
      { 
        type: 'number', 
        position: 'left',
        title: { text: 'Nombre de comptes' },
      },
    ],
  };
  return (
    <div className="chart">
        <AgCharts options={activeUsersChartOptions} />
    </div>
  );
}

export default NumberOfAccountsCreated;