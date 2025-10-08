import { pool } from "../db.js";

export const applyToJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const seekerId = req.user.userId;

    const jobRes = await pool.query("SELECT * FROM jobs WHERE id = $1", [
      jobId,
    ]);
    if (jobRes.rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    } 

    try {
      const result = await pool.query(
        `INSERT INTO applications (job_id, seeker_id)
         VALUES ($1, $2)
         RETURNING *`,
        [jobId, seekerId]
      );

      const application = result.rows[0];

      return res.status(201).json({
        message: "Application submitted successfully",
        application,
      });
    } catch (err) {
      if (err.code === "23505") {
        return res
          .status(400)
          .json({ message: "You have already applied to this job" });
      }
      throw err;
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const seekerId = req.user.userId;

    const result = await pool.query(
      `SELECT a.id AS application_id, a.created_at, 
              j.title, j.location, j.category, j.description, j.id AS job_id
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.seeker_id = $1
       ORDER BY a.created_at DESC`,
      [seekerId]
    );

    const applications = result.rows;

    if (applications.length === 0) {
      return res.status(200).json({
        message: "You have not applied to any jobs yet",
        applications: [],
      });
    }

    return res.status(200).json({ applications });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getApplicationsForJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const jobRes = await pool.query("SELECT * FROM jobs WHERE id = $1", [
      jobId,
    ]);
    if (jobRes.rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    const job = jobRes.rows[0];

    if (userRole === "employer" && job.employer_id !== userId) {
      return res.status(403).json({
        message: "You are not authorized to view applications for this job",
      });
    }

    //  applications for this job, joined with seeker info
    const result = await pool.query(
      `SELECT a.id AS application_id, a.created_at,
              u.id AS seeker_id, u.name AS seeker_name, u.email AS seeker_email
       FROM applications a
       JOIN users u ON a.seeker_id = u.id
       WHERE a.job_id = $1
       ORDER BY a.created_at DESC`,
      [jobId]
    );

    const applications = result.rows;

    if (applications.length === 0) {
      return res.status(200).json({
        message: "No applications yet for this job",
        applications: [],
      });
    }

    return res.status(200).json({ job_title: job.title, applications });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const appRes = await pool.query("SELECT * FROM applications WHERE id = $1", [applicationId]);
    if (appRes.rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    const application = appRes.rows[0];

    if (userRole === "job_seeker" && application.seeker_id !== userId) {
      return res.status(403).json({ message: "You are not allowed to delete this application" });
    }

    await pool.query("DELETE FROM applications WHERE id = $1", [applicationId]);

    return res.status(200).json({ message: "Application withdrawn successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
