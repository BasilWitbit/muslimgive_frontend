import React, { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { RatingBand, RATING_BAND_STYLES } from '@/lib/audit-scoring';

type RatingBandBadgeProps = {
    ratingBand: RatingBand | null | undefined;
    className?: string;
};

const RatingBandBadge: FC<RatingBandBadgeProps> = ({ ratingBand, className }) => {
    if (!ratingBand) return null;

    const style = RATING_BAND_STYLES[ratingBand];

    return (
        <Badge
            className={className}
            style={{
                backgroundColor: style.bg,
                color: style.text,
                border: 'none',
            }}
        >
            {ratingBand}
        </Badge>
    );
};

export default RatingBandBadge;
