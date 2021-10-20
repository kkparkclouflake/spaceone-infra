import * as cdk from '@aws-cdk/core';
import * as eks from '@aws-cdk/aws-eks';

import * as yaml from 'js-yaml';

import * as fs from 'fs';

import { EksProps } from '../props/eks-props'

export class ExternalDnsDeploy extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, eks: EksProps) {
        super(scope, id);

        // Create IAM role

        // Attach IAM role

        // Install EBS CSI Driver
    }
}