import React from 'react'
import { Link } from 'react-router-dom'
import './Sidebar.css'



import list_product_icon from '../Assets/Product_list_icon.svg'
import dashBoard_icon from '../Assets/Product_list_icon.svg'



const Sidebar = () => {
  return (
    <div className='sidebar'>
      <Link to='/' style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={dashBoard_icon} alt="" />
          <p>DashBoard</p>
        </div>
      </Link>
      <Link to='/listproduct' style={{ textDecoration: 'none' }}>
        <div className="sidebar-item">
          <img src={list_product_icon} alt="" />
          <p>Product List</p>
        </div>
      </Link>      
    </div>
  )
}

export default Sidebar
