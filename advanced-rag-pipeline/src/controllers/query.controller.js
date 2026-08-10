import { queryProcessor } from "../query/query.processor.js"
import { prisma } from "../../config/prisma.js"
import { getAuth } from '@clerk/express'

export async function queryController(req, res){
    try {
        const {query, notebookId} = req.body
        const { userId } = getAuth(req)
    
        if(!query)
            return res.status(400).json({success: false, message: "No Query found!"})

        if(!notebookId)
            return res.status(400).json({success: false, message: "notebookId is required"})

        if (!userId) {
            return res.status(401).json({ success: false, message: "unauthorized" });
        }

        const notebook = await prisma.notebook.findFirst({ where: { id: notebookId, userId } });
        if (!notebook) {
            return res.status(404).json({ success: false, message: "Notebook not found" });
        }
    
        const result = await queryProcessor(query, notebookId)

        console.log("queryController-result: ", result)
    
        return res.json(result)
    } catch (error) {
        console.error("Error in queryController: ", error)

        res.status(500).json({
            success: false,
            message: 'something went wrong in queryController'
        })
    }
}