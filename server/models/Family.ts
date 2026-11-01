import mongoose, { Schema } from 'mongoose';

export interface IFamilyMember {
  userId: any;
  role: 'owner' | 'member';
  joinedAt: Date;
}

export interface IFamily {
  _id?: any;
  name: string;
  inviteCode: string;
  createdBy: any;
  members: IFamilyMember[];
  createdAt: Date;
  updatedAt?: Date;
}

export const FamilyMemberSchema = new Schema<IFamilyMember>(
  {
    userId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

export const FamilySchema = new Schema<IFamily>(
  {
    name: {
      type: String,
      required: [true, 'Tên nhóm gia đình là bắt buộc'],
      trim: true,
      maxlength: [100, 'Tên gia đình tối đa 100 ký tự'],
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
    },
    members: [FamilyMemberSchema],
  },
  {
    timestamps: true,
  }
);

FamilySchema.index({ inviteCode: 1 });
FamilySchema.index({ createdBy: 1 });

export const FamilyModel = mongoose.models.Family || mongoose.model<IFamily>('Family', FamilySchema);
