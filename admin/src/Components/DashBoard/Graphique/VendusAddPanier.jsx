import React, { useState, useEffect } from "react";
import { AgCharts } from "ag-charts-react";
import { backend_url } from "../../../App";

const VendusAddPanier = () => {
    
    const [cartStats, setCartStats] = useState({});
    useEffect(() => {
        fetch(`${backend_url}/cart-stats`)
          .then(response => response.json())
          .then(data => setCartStats(data))
          .catch(error => console.error('Erreur:', error));
    }, []);

    const pieChartData = [
      { label: 'Articles Vendus', value: cartStats.soldItems || 0 },
      { label: 'Ajouts au Panier', value: cartStats.cartItems || 0 },
    ];

    const pieChartOptions = {
      data: pieChartData,
      title: { text: 'Vendus vs Ajouts au Panier', fontSize: 18 },
      series: [{
        type: 'pie',
        angleKey: 'value',
        calloutLabelKey: 'label', // Utilisez 'calloutLabelKey' au lieu de 'labelKey'
      }],
    };  

  return (
    <div className="chart">
        <AgCharts options={pieChartOptions} />
    </div>
  )
}

export default VendusAddPanier