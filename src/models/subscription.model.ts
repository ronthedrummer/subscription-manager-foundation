import mongoose, { Schema, model, Document } from 'mongoose';

export enum SubscriptionTier {
  Basic = 'basic',
  Advanced = 'advanced',
  Pro = 'pro',
  ProPlus = 'pro-plus'
}

export enum SubscriptionTerm {
  Monthly = 'monthly',
  Annually = 'annually'
}

export interface SubscriptionDocument extends Document {
  tier: SubscriptionTier;
  term: SubscriptionTerm;
  user?: mongoose.Schema.Types.ObjectId;
  organization?: mongoose.Schema.Types.ObjectId;
  stripeCustomerID?: string;
  nextRenewal: Date;
  updateRenewalDate: (date?: Date) => Promise<void>;
}

const SubscriptionSchema: Schema = new Schema(
  {
    tier: {
      type: String,
      required: true,
      enum: ['basic', 'advanced', 'pro', 'pro-plus']
    },
    term: {
      type: String,
      required: true,
      enum: ['monthly', 'annually']
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: function (v: mongoose.Types.ObjectId) {
          const subscription = this as SubscriptionDocument;
          return !!v || !!subscription.organization;
        },
        message: 'Either User or Organization ID is required'
      }
    },
    organization: {
      type: mongoose.Types.ObjectId,
      ref: 'Organization',
      validate: {
        validator: function (v: mongoose.Types.ObjectId) {
          const subscription = this as SubscriptionDocument;
          return !!v || !!subscription.user;
        },
        message: 'Either User or Organization ID is required'
      }
    },
    stripeCustomerID: {
      type: String
    },
    nextRenewal: { type: Date }
  },
  { timestamps: true }
);

SubscriptionSchema.pre<SubscriptionDocument>('save', function (next) {
  if (this.isNew) {
    const now = new Date();
    let renewal_date;
    if (this.term === 'monthly') {
      // renewal date will be in one month from the creation date
      renewal_date = new Date(now.setMonth(now.getMonth() + 1));
    } else {
      // renewal date will be in one year from the creation date
      renewal_date = new Date(now.setFullYear(now.getFullYear() + 1));
    }
    this.nextRenewal = renewal_date;
  }
  next();
});

SubscriptionSchema.methods.updateRenewalDate = async function (date?: Date) {
  let renewal_date;
  const now = new Date();
  if (date) {
    renewal_date = date;
  } else if (this.term === 'monthly') {
    // renewal date will be in one month from the creation date
    renewal_date = new Date(now.setMonth(now.getMonth() + 1));
  } else {
    // renewal date will be in one year from the creation date
    renewal_date = new Date(now.setFullYear(now.getFullYear() + 1));
  }
  this.renewal_date = renewal_date;
};

export const Subscription = model<SubscriptionDocument>(
  'Subscription',
  SubscriptionSchema
);
