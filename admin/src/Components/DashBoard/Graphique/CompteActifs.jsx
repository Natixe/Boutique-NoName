import React, { useState, useEffect } from "react";
import { AgCharts } from "ag-charts-react";
import { backend_url } from "../../../App";

const CompteActifs = () => {

    const [activeUsersData, setActiveUsersData] = useState([]);
    
    useEffect(() => {
        fetch(`${backend_url}/active-users`)
          .then(response => response.json())
          .then(data => {
            const formattedData = data.map(item => ({
              ...item,
              timestamp: new Date(item.timestamp), // Conversion en objet Date
            }));
            setActiveUsersData(formattedData);
          })
          .catch(error => console.error('Erreur:', error));
      }, []);;
    
      const activeUsersChartOptions = {
        data: activeUsersData,
        title: { text: 'Utilisateurs Actifs', fontSize: 18 },
        series: [{
          xKey: 'timestamp',
          yKey: 'user_count',
          type: 'line',
          marker: { enabled: true },
        }],
        axes: [
          { type: 'time', position: 'bottom', title: { text: 'Heure' } },
          { type: 'number', position: 'left', title: { text: 'Utilisateurs Actifs' } },
        ],
      };


  return (
    <div className="chart">
        <AgCharts options={activeUsersChartOptions} />
    </div>  
  )
}

export default CompteActifs