import React, { useState, useEffect } from "react";
import { AgCharts } from "ag-charts-react";
import { backend_url } from "../../../App";

const ChiffreAffaire = () => {
    const [revenueData, setRevenueData] = useState([]);

    useEffect(() => {
        fetch(`${backend_url}/revenue`)
          .then(response => response.json())
          .then(data => {
            const formattedData = data.map(item => ({
              ...item,
              order_date: new Date(item.order_date), // Conversion en objet Date
              revenue: parseFloat(item.revenue),     // Conversion en nombre flottant
            }));
            setRevenueData(formattedData);
          })
          .catch(error => console.error('Erreur:', error));
      }, []);
    
      const revenueChartOptions = {
        data: revenueData,
        title: { text: 'Chiffre d\'Affaires Total', fontSize: 18 },
        series: [{
          xKey: 'order_date',
          yKey: 'revenue',
          type: 'line',
          marker: { enabled: true },
        }],
        axes: [
          { type: 'time', position: 'bottom', title: { text: 'Date' } },
          { type: 'number', position: 'left', title: { text: 'Revenu (€)' } },
        ],
      };    
  return (
    <div className="chart">
        <AgCharts options={revenueChartOptions} />
    </div>
  )
}

export default ChiffreAffaire