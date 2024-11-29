import React, { useState, useEffect } from "react";
import { AgCharts } from "ag-charts-react";
import { backend_url } from "../../../App";

const CAcategorie = () => {
    const [revenueByCategoryData, setRevenueByCategoryData] = useState([]);

    useEffect(() => {
      fetch(`${backend_url}/revenue-by-category`)
        .then(response => response.json())
        .then(data => {
          const transformedData = {};
          data.forEach(item => {
            const date = new Date(item.order_date); // Conversion en objet Date
            const dateKey = date.getTime(); // Utiliser le timestamp comme clé pour éviter les problèmes avec les objets Date comme clés d'objet
    
            if (!transformedData[dateKey]) {
              transformedData[dateKey] = { order_date: date };
              // Initialiser les catégories à 0
              categories.forEach(category => {
                transformedData[dateKey][category] = 0;
              });
            }
            transformedData[dateKey][item.category] = parseFloat(item.revenue);
          });
          const finalData = Object.values(transformedData);
          setRevenueByCategoryData(finalData);
        })
        .catch(error => console.error('Erreur:', error));
    }, []);
  
    const transformedData = {};
  
    revenueByCategoryData.forEach(item => {
      const date = item.order_date;
      if (!transformedData[date]) {
        transformedData[date] = { order_date: date };
      }
      transformedData[date][item.category] = item.revenue;
    });
  
    const categories = ['women', 'men', 'kids'];
  
    const revenueByCategoryChartOptions = {
      data: revenueByCategoryData,
      title: { text: 'Chiffre d\'Affaires par Catégorie', fontSize: 18 },
      series: categories.map(category => ({
        type: 'area',
        xKey: 'order_date',
        yKey: category,
        yName: category,
        stacked: true,
      })),
      axes: [
        { type: 'time', position: 'bottom', title: { text: 'Date' } },
        { type: 'number', position: 'left', title: { text: 'Revenu (€)' } },
      ],
    };    
  return (
    <div className="chart">
        <AgCharts options={revenueByCategoryChartOptions} />
    </div>
  )
}

export default CAcategorie