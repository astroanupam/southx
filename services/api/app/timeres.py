"""Civil-time resolution (local birth time -> UTC) using the IANA tz database.

Stage 1 only: no astronomical calculation lives here.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


@dataclass
class Resolved:
    tz_id: str
    offset_sec: int
    dst_active: bool
    source: str  # "auto" | "manual"
    utc: datetime
    local_civil: str
    warnings: list[str] = field(default_factory=list)
    manual_reason: str | None = None


def _offset(tz: ZoneInfo, local: datetime, fold: int) -> int:
    return int(local.replace(tzinfo=tz, fold=fold).utcoffset().total_seconds())  # type: ignore[union-attr]


def resolve(local: datetime, tz_id: str, manual_offset_sec: int | None = None,
            manual_reason: str | None = None) -> Resolved:
    """`local` is a naive civil datetime. Raises ValueError for unknown zones."""
    if local.tzinfo is not None:
        raise ValueError("local must be naive")
    civil = local.strftime("%Y-%m-%d %H:%M:%S")

    if manual_offset_sec is not None:
        return Resolved(tz_id, manual_offset_sec, False, "manual",
                        (local - timedelta(seconds=manual_offset_sec)).replace(tzinfo=timezone.utc),
                        civil, ["MANUAL_OFFSET_DST_NOT_DETERMINED"], manual_reason)

    try:
        tz = ZoneInfo(tz_id)
    except (ZoneInfoNotFoundError, ValueError, OSError) as e:
        raise ValueError(f"unknown time zone: {tz_id}") from e

    warnings: list[str] = []
    o0, o1 = _offset(tz, local, 0), _offset(tz, local, 1)
    if o0 != o1:
        # fold=0 and fold=1 disagree: either a repeated hour (overlap) or a skipped hour (gap).
        utc0 = local - timedelta(seconds=o0)
        back = utc0.replace(tzinfo=timezone.utc).astimezone(tz).replace(tzinfo=None)
        if back == local:
            warnings.append("AMBIGUOUS_LOCAL_TIME_REPEATED_HOUR")
        else:
            warnings.append("SKIPPED_LOCAL_TIME_CHECK_MANUALLY")
    offset = o0

    jan = int(datetime(local.year, 1, 1, tzinfo=timezone.utc).astimezone(tz).utcoffset().total_seconds())  # type: ignore[union-attr]
    jul = int(datetime(local.year, 7, 1, tzinfo=timezone.utc).astimezone(tz).utcoffset().total_seconds())  # type: ignore[union-attr]
    dst = jan != jul and offset > min(jan, jul)
    if local.year < 1900:
        warnings.append("PRE_1900_LMT_POSSIBLE")

    utc = (local - timedelta(seconds=offset)).replace(tzinfo=timezone.utc)
    return Resolved(tz_id, offset, dst, "auto", utc, civil, warnings)
