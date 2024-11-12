import React, { useEffect, useState } from 'react';
import { AgCharts } from 'ag-charts-react';
import './DashBoard.css';
import { backend_url, currency } from "../../App";


const DashBoard = () => {
  const [visitData, setVisitData] = useState([]);
  const [activeUsersData, setActiveUsersData] = useState([]);
  const [cartStats, setCartStats] = useState({});
  const [revenueData, setRevenueData] = useState([]);
  const [revenueByCategoryData, setRevenueByCategoryData] = useState([]);



  useEffect(() => {
    fetch(`${backend_url}/visits`)
      .then(response => response.json())
      .then(data => {
        const formattedData = data.map(item => ({
          ...item,
          visit_date: new Date(item.visit_date), // Conversion en objet Date
        }));
        setVisitData(formattedData);
      })
      .catch(error => console.error('Erreur:', error));
  }, []);

  const visitChartOptions = {
    data: visitData,
    title: { text: 'Nombre de Visites', fontSize: 18 },
    series: [{
      xKey: 'visit_date',
      yKey: 'visit_count',
      type: 'line',
      marker: { enabled: true },
    }],
    axes: [
      { type: 'time', position: 'bottom', title: { text: 'Date' } },
      { type: 'number', position: 'left', title: { text: 'Visiteurs' } },
    ],
  };

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
  const finalData = Object.values(transformedData);

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
    <>
      <div className="dashboard">
        <h1>Tableau de Bord</h1>
        <div className="chart">
          <AgCharts options={visitChartOptions} />
        </div>
        <div className="chart">
          <AgCharts options={activeUsersChartOptions} />
        </div>
        <div className="chart">
          <AgCharts options={pieChartOptions} />
        </div>
        <div className="chart">
          <AgCharts options={revenueChartOptions} />
        </div>
        <div className="chart">
          <AgCharts options={revenueByCategoryChartOptions} />
        </div>
      </div>
    </>
  );
};

export default DashBoard;
