
import React, { useState, useEffect } from "react";
import { AgCharts } from "ag-charts-react";
import { backend_url } from "../../../App";

const NombreDeVisit = () => {
    const [visitData, setVisitData] = useState([]);
    useEffect(() => {
        fetch(`${backend_url}/visits`)
          .then(response => response.json())
          .then(data => {
            const formattedData = data.map(item => ({
              ...item,
              visit_date: new Date(item.visit_date)
            }));
            setVisitData(formattedData);
          })
          .catch(error => console.error('Erreur:', error));
      }, []);

    const visitChartOptions = {
      title: { text: 'Nombre de Visites', fontSize: 18 },
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
        { type: 'time', position: 'bottom', title: { text: 'Date' } },
        { type: 'number', position: 'left', title: { text: 'Visiteurs' } },
      ],
    };
    
  return (
    <div className="chart">
        <AgCharts options={visitChartOptions} />
    </div>
  )
};
export default NombreDeVisit;
