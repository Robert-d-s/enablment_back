import { Injectable } from '@nestjs/common';
import { PrismaClient, Issue, Label } from '@prisma/client';
import { IssueWebhookData } from '../webhook/webhook.service';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

@Injectable()
export class IssueService {
  async all(): Promise<Issue[]> {
    return prisma.issue.findMany({
      include: {
        labels: true,
      },
    });
  }

  // async create(data: {
  //   id: string;
  //   createdAt: string;
  //   updatedAt: string;
  //   title: string;
  //   dueDate: string;
  //   projectId: string;
  //   priorityLabel: string;
  //   identifier: string;
  //   assigneeName: string;
  //   projectName: string;
  //   state: string;
  //   teamKey: string;
  //   teamName: string;
  //   labels: { id: string }[];
  // }): Promise<Issue> {
  //   // First, create the issue without labels
  //   const createdIssue = await prisma.issue.create({
  //     data: {
  //       id: data.id,
  //       createdAt: data.createdAt,
  //       updatedAt: data.updatedAt,
  //       title: data.title,
  //       dueDate: data.dueDate,
  //       projectId: data.projectId,
  //       priorityLabel: data.priorityLabel,
  //       identifier: data.identifier,
  //       assigneeName: data.assigneeName,
  //       projectName: data.projectName,
  //       state: data.state,
  //       teamKey: data.teamKey,
  //       teamName: data.teamName,
  //     },
  //   });

  //   // Then, update the issue to connect the labels
  //   if (data.labels && data.labels.length > 0) {
  //     await prisma.issue.update({
  //       where: { id: data.id },
  //       data: {
  //         labels: {
  //           connect: data.labels,
  //         },
  //       },
  //     });
  //   }

  //   return createdIssue;
  // }

  async create(data: IssueWebhookData): Promise<Issue> {
    const createdIssue = await prisma.issue.create({
      data: {
        id: data.id,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        title: data.title,
        dueDate: data.dueDate,
        projectId: data.projectId,
        priorityLabel: data.priorityLabel,
        identifier: data.identifier,
        assigneeName: data.assignee?.name || 'No Assignee',
        projectName: data.project?.name,
        state: data.state?.name,
        teamKey: data.team?.key,
        teamName: data.team?.name,
      },
    });
    return createdIssue;
  }

  // async remove(id: string): Promise<Issue> {
  //   return prisma.issue.delete({
  //     where: {
  //       id,
  //     },
  //   });
  // }

  // async remove(id: string): Promise<Issue> {
  //   await prisma.issue.update({
  //     where: { id },
  //     data: {
  //       labels: {
  //         set: [], // Disconnect all associated labels
  //       },
  //     },
  //   });
  //   return prisma.issue.delete({
  //     where: { id },
  //   });
  // }

  // async update(
  //   id: string,
  //   updateData: {
  //     createdAt: string;
  //     updatedAt: string;
  //     title: string;
  //     dueDate: string;
  //     projectId: string;
  //     priorityLabel: string;
  //     identifier: string;
  //     assigneeName: string;
  //     projectName: string;
  //     state: string;
  //     teamKey: string;
  //     teamName: string;
  //     labelIds?: string[];
  //   },
  // ): Promise<Issue> {
  //   const updatePayload: any = { ...updateData };
  //   // Remove the labelIds field from the update payload
  //   delete updatePayload.labelIds;

  //   if (updateData.labelIds) {
  //     // Debugging: Log the label IDs
  //     console.log(
  //       'Updating labels for issue:',
  //       id,
  //       'Label IDs:',
  //       updateData.labelIds,
  //     );

  //     // Check if label IDs exist in the database
  //     const existingLabels = await prisma.label.findMany({
  //       where: {
  //         id: { in: updateData.labelIds },
  //       },
  //     });

  //     if (existingLabels.length !== updateData.labelIds.length) {
  //       console.error(
  //         'Some labels not found in the database:',
  //         updateData.labelIds,
  //       );
  //       // Handle error appropriately
  //       // e.g., throw an error, return a specific response, etc.
  //     }

  //     updatePayload.labels = {
  //       set: [], // Disconnect all existing labels
  //       connect: existingLabels.map((label) => ({ id: label.id })), // Connect existing labels
  //     };
  //   }

  //   return prisma.issue.update({
  //     where: { id },
  //     data: updatePayload,
  //   });
  // }

  // async addLabelToIssue(issueId: string, labelId: string): Promise<void> {
  //   await prisma.issue.update({
  //     where: { id: issueId },
  //     data: {
  //       labels: {
  //         connect: { id: labelId },
  //       },
  //     },
  //   });
  // }

  // async updateLabelsForIssue(
  //   issueId: string,
  //   newLabelIds: string[],
  // ): Promise<void> {
  //   await prisma.issue.update({
  //     where: { id: issueId },
  //     data: {
  //       labels: {
  //         set: [], // Disconnect all existing labels
  //         connect: newLabelIds.map((labelId) => ({ id: labelId })), // Connect new labels
  //       },
  //     },
  //   });
  // }

  async update(id: string, data: IssueWebhookData): Promise<Issue> {
    // Update the issue without handling labels
    return prisma.issue.update({
      where: { id },
      data: {
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        title: data.title,
        dueDate: data.dueDate,
        projectId: data.projectId,
        priorityLabel: data.priorityLabel,
        identifier: data.identifier,
        assigneeName: data.assignee?.name || 'No Assignee',
        projectName: data.project?.name,
        state: data.state?.name,
        teamKey: data.team?.key,
        teamName: data.team?.name,
      },
    });
  }

  async updateLabelsForIssue(
    issueId: string,
    labels: IssueWebhookData['labels'],
  ): Promise<void> {
    for (const label of labels) {
      await this.createOrUpdateLabel(label, issueId);
    }

    await prisma.issue.update({
      where: { id: issueId },
      data: {
        labels: {
          connect: labels.map((label) => ({ id: label.id })),
        },
      },
    });
  }

  private async createOrUpdateLabel(
    label: IssueWebhookData['labels'][number],
    issueId: string,
  ): Promise<void> {
    const existingLabel = await prisma.label.findUnique({
      where: { id: label.id },
    });

    if (existingLabel) {
      await prisma.label.update({
        where: { id: label.id },
        data: {
          name: label.name,
          color: label.color,
          parentId: label.parentId,
          // Update issueId if necessary
        },
      });
    } else {
      await prisma.label.create({
        data: {
          id: label.id,
          name: label.name,
          color: label.color,
          parentId: label.parentId,
          issueId, // Associate the new label with the issue
        },
      });
    }
  }

  async remove(id: string): Promise<void> {
    await prisma.issue.delete({
      where: { id },
    });
  }

  async createLabelIfNotExists(label: {
    id: string;
    name: string;
    color: string;
    parentId?: string;
    issueId: string;
  }): Promise<void> {
    console.log('Checking existence of label:', label.id);
    try {
      const labelExists = await prisma.label.findUnique({
        where: { id: label.id },
      });
      console.log('Label exists:', !!labelExists, 'for label:', label.id);

      if (!labelExists) {
        console.log('Label does not exist, creating new label:', label);
        // await prisma.label.create({
        //   data: {
        //     id: label.id,
        //     name: label.name,
        //     color: label.color,
        //     parentId: label.parentId,
        //   },
        // });
        const createdLabel = await prisma.label.create({
          data: label,
        });
        console.log('Label created:', createdLabel);
      } else {
        console.log('Label already exists, skipping creation:', label.id);
      }
    } catch (error) {
      console.error('Error in createLabelIfNotExists:', error);
    }
  }

  // async updateLabelsForIssue(
  //   issueId: string,
  //   labels: Array<{
  //     id: string;
  //     name: string;
  //     color: string;
  //     parentId?: string;
  //   }>,
  // ): Promise<void> {
  //   console.log('Updating labels for issue:', issueId, 'Labels:', labels);
  //   try {
  //     for (const label of labels) {
  //       console.log('Processing label:', label);
  //       await this.createLabelIfNotExists(label);
  //     }
  //     console.log(
  //       'Updating issue with new labels:',
  //       issueId,
  //       labels.map((l) => l.id),
  //     );

  //     await prisma.issue.update({
  //       where: { id: issueId },
  //       data: {
  //         labels: {
  //           set: [], // Disconnect all existing labels
  //           connect: labels.map((label) => ({ id: label.id })), // Connect new labels
  //         },
  //       },
  //     });
  //     console.log('Issue updated successfully:', issueId);
  //   } catch (error) {
  //     console.error('Error in updateLabelsForIssue:', error);
  //   }
  // }

  // async updateLabelsForIssue(issueId: string, labels: Label[]): Promise<void> {
  //   console.log('Updating labels for issue:', issueId, 'Labels:', labels);

  //   try {
  //     for (const label of labels) {
  //       await this.createLabelIfNotExists(label);
  //     }

  //     await prisma.issue.update({
  //       where: { id: issueId },
  //       data: {
  //         labels: {
  //           set: [], // Disconnect existing labels
  //           connect: labels.map((label) => ({ id: label.id })),
  //         },
  //       },
  //     });
  //     console.log('Issue updated successfully:', issueId);
  //   } catch (error) {
  //     console.error('Error in updateLabelsForIssue:', error);
  //   }
  // }

  async removeLabelFromIssue(issueId: string, labelId: string): Promise<void> {
    await prisma.issue.update({
      where: { id: issueId },
      data: {
        labels: {
          disconnect: [{ id: labelId }],
        },
      },
    });
  }
}
