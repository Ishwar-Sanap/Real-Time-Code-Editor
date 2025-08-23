import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './App.css'
import Home from './pages/Home'
import EditorPage from './pages/EditorPage'

function App() {

  return (
    <>
      <div>
        <Toaster position='top-center' />

      </div>

    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} > </Route>
        <Route path='/editor/:roomID' element={<EditorPage />} > </Route>
      
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
