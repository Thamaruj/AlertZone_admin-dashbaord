import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp, 
  arrayUnion, 
  addDoc, 
  getDoc,
  query,
  orderBy,
  QueryConstraint,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Report, ReportStatus, StatusHistoryEntry } from '@/lib/types/report';

/**
 * Subscribe to reports in real-time
 */
export function subscribeToReports(
  callback: (reports: Report[]) => void,
  statusFilter?: ReportStatus | "All"
) {
  const reportsRef = collection(db, 'reports');
  
  const constraints: QueryConstraint[] = [
    // Filter out archived reports
    where('isArchived', '==', false),
    orderBy('createdAt', 'desc')
  ];

  if (statusFilter && statusFilter !== "All") {
    constraints.unshift(where('status', '==', statusFilter));
  }

  const q = query(reportsRef, ...constraints);

  return onSnapshot(q, (snapshot) => {
    const reports: Report[] = [];
    snapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() } as Report);
    });
    callback(reports);
  }, (error) => {
    console.error("Error subscribing to reports:", error);
  });
}

/**
 * Update a report's status and automatically create a notification for the citizen
 */
export async function updateReportStatus(
  reportId: string,
  newStatus: ReportStatus,
  adminUid: string,
  note?: string
) {
  const reportRef = doc(db, 'reports', reportId);
  
  // 1. Get current report data for notification and history
  const reportSnap = await getDoc(reportRef);
  if (!reportSnap.exists()) {
    throw new Error('Report not found');
  }
  
  const reportData = reportSnap.data() as Report;
  const previousStatus = reportData.status;

  // 2. Prepare the new history entry
  const historyEntry: StatusHistoryEntry = {
    status: newStatus,
    changedAt: new Date().toISOString(), // Using ISO string to avoid Timestamp vs client Date issues in arrayUnion
    changedBy: adminUid,
  };
  
  if (note) {
    historyEntry.note = note;
  }

  // 3. Update the report document
  const updatePayload: any = {
    status: newStatus,
    updatedAt: serverTimestamp(),
    statusHistory: arrayUnion(historyEntry),
  };

  if (note) {
    updatePayload.resolutionNote = note;
  }

  await updateDoc(reportRef, updatePayload);

  // 4. Create notification for the citizen
  await addDoc(collection(db, 'notifications'), {
    recipientUid: reportData.uid,
    type: 'status_change',
    title: 'Report Status Updated',
    body: `Your report "${reportData.title}" status changed to ${newStatus}.`,
    reportId: reportId,
    data: { previousStatus, newStatus },
    isRead: false,
    createdAt: serverTimestamp(),
  });

  // 5. If status is RESOLVED, we should ideally increment user points.
  // We can do this here or let a Cloud Function handle it. 
  // For now, we increment the user's `reportsValidated` count here.
  if (newStatus === "RESOLVED") {
      const userRef = doc(db, 'users', reportData.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
          const userData = userSnap.data();
          await updateDoc(userRef, {
              reportsValidated: (userData.reportsValidated || 0) + 1,
              contributionPoints: (userData.contributionPoints || 0) + 10 // Example: 10 points
          });
      }
  }
}
