import {prisma} from '../../config/prisma.js'
import { getAuth } from '@clerk/express'


export async function createNotebook(req, res){
    try {
        const {name} = req.body
        const { userId } = getAuth(req)

        console.log("Name: ", name)

        if(!name) return res.status(400).json({success: false, message: 'name is required'})
        if(!userId) return res.status(401).json({success: false, message: 'unauthorized'})

        const notebook = await prisma.notebook.create({data: {name, userId}})

        res.json(notebook)

    } catch (error) {
        console.error("Error in createNotebook: ", error)

        res.status(500).json({success: false, message: "Something went wrong in createNotebook"})
    }
}

export async function listNotebooks(req, res){
    try {
        const { userId } = getAuth(req)
        const notebooks = await prisma.notebook.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        })

        res.json(notebooks)
        
    } catch (error) {
        console.log("Error in listNotebooks: ",error)
        res.status(500).json({success: false, message: "Something went wrong in listNotebooks"})
    }
}

export async function getNotebook(req, res) {
  try {
    const { id } = req.params;
    const { userId } = getAuth(req)
    const notebook = await prisma.notebook.findFirst({
      where: { id, userId },
      include: { sources: true },
    });
    if (!notebook) return res.status(404).json({ success: false, message: "not found" });
    res.json(notebook);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "something went wrong" });
  }
}